import os

target_file = '/data/data/com.termux/files/home/TheNeuralVault/QEA-JS-ENGINES/qea_bridge.js'

with open(target_file, 'r') as f:
    content = f.read()

# Patch 1: Injecting the Biological Nodes
if 'NITROGENASE_TUNNELING' not in content:
    content = content.replace(
        "{ id: 'FMO_300K', rel: 'amplifies', targets: ['ENTANGLEMENT_FIDELITY'], strength: 0.65 },",
        "{ id: 'FMO_300K', rel: 'amplifies', targets: ['ENTANGLEMENT_FIDELITY'], strength: 0.65 },\n        { id: 'NITROGENASE_TUNNELING', rel: 'enables', targets: ['EXCITON_COHERENCE'], strength: 0.95 },\n        { id: 'EXCITON_COHERENCE', rel: 'amplifies', targets: ['ENTANGLEMENT_FIDELITY'], strength: 0.88 },"
    )

# Patch 2: Expanding the Vocabulary Keywords
if 'nitrogenase' not in content:
    content = content.replace(
        "Biology: ['photosynthesis','chlorophyll','fmo','biological','exciton'],",
        "Biology: ['photosynthesis','chlorophyll','fmo','biological','exciton','nitrogenase','tunneling','enzyme'],"
    )

with open(target_file, 'w') as f:
    f.write(content)

print("[SUCCESS] Biological Matrix Expanded in qea_bridge.js.")
