# app/utils_dft.py
import multiprocessing

import numpy as np
import pandas as pd
from rdkit import Chem
from rdkit.Chem import AllChem
import psi4
import gc

# ---- Global ultra-low memory psi4 config (per-process) ----
psi4.set_memory('512 MB')

psi4.set_num_threads(min(4, multiprocessing.cpu_count()))

def smiles_to_3d_mol(smiles: str):
    m = Chem.MolFromSmiles(smiles)
    if not m:
        return None
    m = Chem.AddHs(m)
    params = AllChem.ETKDGv3()
    params.randomSeed = 7
    params.pruneRmsThresh = 0.1
    if AllChem.EmbedMolecule(m, params) != 0:
        return None
    AllChem.UFFOptimizeMolecule(m, maxIters=100)
    return m

def rdkit_to_psi4(mol):
    conf = mol.GetConformer()
    lines = []
    for i, a in enumerate(mol.GetAtoms()):
        x, y, z = conf.GetAtomPosition(i)
        lines.append(f"{a.GetSymbol()} {x:.6f} {y:.6f} {z:.6f}")
    return psi4.geometry("units angstrom\n" + "\n".join(lines))

def calc_dft_minimal(smiles, method="HF", basis="STO-3G"):
    m = smiles_to_3d_mol(smiles)
    if m is None:
        return dict(psi4_ok=0, E_hf=None, homo=None, lumo=None, gap=None, error="embed_failed")

    try:
        mol4 = rdkit_to_psi4(m)
        psi4.set_options({
            "basis": basis,
            "scf_type": "pk",          # very low memory
            "reference": "rhf",
            "d_convergence": 1e-5,
            "e_convergence": 1e-5,
            "maxiter": 30,
        })
        e, wfn = psi4.energy(f"{method}/{basis}", molecule=mol4, return_wfn=True)

        eps = np.array(wfn.epsilon_a().to_array())
        nocc = wfn.nalpha()
        homo = float(eps[nocc - 1]) if nocc > 0 else None
        lumo = float(eps[nocc]) if nocc < len(eps) else None
        gap = (lumo - homo) if (homo is not None and lumo is not None) else None

        wfn = None
        psi4.core.clean()
        gc.collect()

        return dict(psi4_ok=1, E_hf=float(e), homo=homo, lumo=lumo, gap=gap, error=None)
    except Exception as ex:
        psi4.core.clean()
        gc.collect()
        return dict(psi4_ok=0, E_hf=None, homo=None, lumo=None, gap=None, error=str(ex)[:300])

def enrich_dataset(dataset: list[dict], smiles_column: str,sa_column:str, top_k: int):
    """
    Returns (rows_enriched, processed_count, errors)
    - rows_enriched: list of dicts (original row + psi4_* fields)
    - processed_count: int
    - errors: list of {"index": i, "smiles": "...", "error": "..."}
    """
    df = pd.DataFrame(dataset)

    if smiles_column not in df.columns:
        raise ValueError(f"SMILES column '{smiles_column}' not found in dataset")

    # choose top-k (respect SynthScore_0to1 if present)
    if sa_column in df.columns:
        cand = df.sort_values(sa_column, ascending=False).head(top_k).copy()
    else:
        cand = df.head(top_k).copy()

    smiles_list = cand[smiles_column].astype(str).tolist()
    enriched_rows = []
    errors = []

    try:
        for i, smi in enumerate(smiles_list):
            res = calc_dft_minimal(smi)
            row = cand.iloc[i].to_dict()
            for k, v in res.items():
                row[f"psi4_{k}"] = v
            enriched_rows.append(row)
            if res.get("psi4_ok") == 0 and res.get("error"):
                errors.append({"index": i, "smiles": smi, "error": res["error"]})
            gc.collect()
    finally:
        pass

    return enriched_rows, len(enriched_rows), errors
