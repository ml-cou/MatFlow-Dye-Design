# Molecular Design Pipeline

```
┌───────────────────┐
│   Preprocessing   │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ cleaned_data.csv  │
└─────┬──────┬──────┘
      │      │
      │      │
      │      ▼
      │  ┌──────────────────────┐
      │  │   SMILES Generation  │
      │  │      (AutoVAE)       │
      │  └────────┬─────────────┘
      │           ▼
      │  ┌──────────────────────┐
      │  │  generated_smiles.csv│
      │  └────────┬──────┬──────┘
      │           │      │
      │           │      ▼
      │           │  ┌────────────────────────┐
      │           │  │ SMILES to IUPAC        │
      │           │  │ Conversion             │
      │           │  └────────┬───────────────┘
      │           │           ▼
      │           │  ┌────────────────────────┐
      │           │  │ smiles_to_iupac.csv    │
      │           │  └────────────────────────┘
      │           │
      │           ▼
      │   ┌────────────────────────────┐
      │   │ Molecular Structure        │
      │   │ Visualization              │
      │   └────────────────────────────┘
      │
      ▼
┌──────────────────────┐
│     Scaling          │
│ (Standard/MinMax/etc)│
└────────┬─────────────┘
         ▼
┌──────────────────────┐
│   scaled_data.csv    │
└────────┬─────────────┘
         ▼
┌──────────────────────┐
│   PSO Optimization   │
└──────────────────────┘
```

## Pipeline Explanation

**1. Preprocessing**: Cleans raw molecular data, removes duplicates, handles missing values → `cleaned_data.csv`

**2. Dual Path Processing**:
- **Path A (Generation)**: 
  - AutoVAE generates new SMILES strings → `generated_smiles.csv`
  - Converts SMILES to chemical names → `smiles_to_iupac.csv`
  - Creates molecular visualizations
- **Path B (Processing)**: Scales numerical features for optimization → `scaled_data.csv`

**3. PSO Optimization**: Uses Particle Swarm Optimization to find optimal molecular properties

**Purpose**: Automated molecular design combining generative AI with optimization for drug discovery and materials science.