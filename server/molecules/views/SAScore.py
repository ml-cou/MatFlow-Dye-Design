from typing import Any, Dict, List, Optional

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rdkit import Chem

from molecules.utils import sascorer


class SmilesSAScoreView(APIView):
    """
    POST JSON:
    {
      "dataset": [ {"id": 1, "smiles": "CCO"}, {"id": 2, "smiles": "O=C(O)C"} ],
      "smiles_column": "smiles",
      "score_key": "sa_score",
      "round_to": 3,
      "drop_invalid": false
    }
    """
    @method_decorator(csrf_exempt)
    def post(self, request, *args, **kwargs):
        data = request.data or {}
        dataset: Optional[List[Dict[str, Any]]] = data.get("dataset")
        smiles_column: Optional[str] = data.get("smiles_column")

        score_key: str = data.get("score_key", "sa_score")
        round_to: Optional[int] = data.get("round_to", 3)
        drop_invalid: bool = bool(data.get("drop_invalid", False))

        # --- basic validation ---
        if not isinstance(dataset, list):
            return Response(
                {"detail": "`dataset` must be a list of objects."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not smiles_column or not isinstance(smiles_column, str):
            return Response(
                {"detail": "`smiles_column` must be a non-empty string."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results: List[Dict[str, Any]] = []
        n_total = len(dataset)
        n_ok = 0
        n_invalid = 0

        for row in dataset:
            if not isinstance(row, dict):
                # non-dict row -> count invalid
                n_invalid += 1
                if not drop_invalid:
                    results.append({
                        **({"_raw": row} if not isinstance(row, dict) else {}),
                        score_key: None,
                        "error": "Row is not an object/dict."
                    })
                continue

            smi = row.get(smiles_column, None)
            if not isinstance(smi, str) or not smi.strip():
                n_invalid += 1
                if not drop_invalid:
                    out = dict(row)
                    out[score_key] = None
                    out["error"] = f"Missing or empty `{smiles_column}`."
                    results.append(out)
                continue

            try:
                mol = Chem.MolFromSmiles(smi)
                if mol is None:
                    raise ValueError("RDKit failed to parse SMILES")

                score = float(sascorer.calculateScore(mol))
                if isinstance(round_to, int):
                    score = round(score, round_to)

                out = dict(row)
                out[score_key] = score
                results.append(out)
                n_ok += 1
            except Exception as e:
                n_invalid += 1
                if not drop_invalid:
                    out = dict(row)
                    out[score_key] = None
                    out["error"] = f"Invalid SMILES: {e}"
                    results.append(out)

        summary = {
            "total": n_total,
            "processed": n_ok,
            "invalid": n_invalid,
            "kept_invalid": (not drop_invalid),
        }

        return Response(
            {"summary": summary, "results": results},
            status=status.HTTP_200_OK
        )
