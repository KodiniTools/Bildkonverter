# KI-Modell für „Hintergrund entfernen“

`isnet-general-use-fp16.onnx` ist das Segmentierungsmodell, das der Editor beim
ersten Klick auf „Hintergrund entfernen“ lädt (`src/lib/backgroundRemoval`). Es
läuft im Browser über ONNX Runtime Web; Bilder verlassen das Gerät nicht.

## Herkunft

- Modell: IS-Net „general use“ aus DIS (Highly Accurate Dichotomous Image
  Segmentation), Xuebin Qin et al., ECCV 2022 – https://github.com/xuebinqin/DIS
- Lizenz des Projekts: Apache License 2.0, siehe `LICENSE-ISNet.txt`
- ONNX-Export: `isnet-general-use.onnx` aus den Releases von rembg
  (https://github.com/danielgatis/rembg/releases/tag/v0.0.0)

## Änderungen gegenüber dem Original (Apache-2.0, Abschnitt 4b)

- Gewichte als float16 gespeichert, mit `Cast` nach float32 vor der Nutzung
  (Rechnung weiterhin in float32; Masken praktisch identisch, Datei halb so groß)
- Nur der Hauptausgang `output_image` bleibt erhalten

## Neu erzeugen

```python
import onnx, numpy as np
from onnx import numpy_helper, helper, TensorProto

m = onnx.load('isnet-general-use.onnx')
g = m.graph
inits, casts = [], []
for init in list(g.initializer):
    if init.data_type == TensorProto.FLOAT and np.prod(init.dims) >= 16:
        h = numpy_helper.from_array(numpy_helper.to_array(init).astype(np.float16), init.name + '_fp16')
        inits.append(h)
        casts.append(helper.make_node('Cast', [h.name], [init.name], to=TensorProto.FLOAT, name=init.name + '_cast'))
    else:
        inits.append(init)
del g.initializer[:]; g.initializer.extend(inits)
nodes = list(g.node); del g.node[:]; g.node.extend(casts + nodes)
outs = [o for o in g.output if o.name == 'output_image']; del g.output[:]; g.output.extend(outs)
onnx.save(m, 'isnet-general-use-fp16.onnx')
```
