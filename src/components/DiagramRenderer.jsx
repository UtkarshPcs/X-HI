import React, { Suspense } from 'react';

// Mathematics
const Angle = React.lazy(() => import('../svg-library/mathematics/Angle'));
const Circle = React.lazy(() => import('../svg-library/mathematics/Circle'));
const Construction = React.lazy(() => import('../svg-library/mathematics/Construction'));
const CoordinatePlane = React.lazy(() => import('../svg-library/mathematics/CoordinatePlane'));
const LineSegment = React.lazy(() => import('../svg-library/mathematics/LineSegment'));
const NumberLine = React.lazy(() => import('../svg-library/mathematics/NumberLine'));
const ParallelLines = React.lazy(() => import('../svg-library/mathematics/ParallelLines'));
const Polygon = React.lazy(() => import('../svg-library/mathematics/Polygon'));
const Quadrilateral = React.lazy(() => import('../svg-library/mathematics/Quadrilateral'));
const Triangle = React.lazy(() => import('../svg-library/mathematics/Triangle'));

// Physics
const ConcaveLensRay = React.lazy(() => import('../svg-library/physics/ConcaveLensRay'));
const ConcaveMirrorRay = React.lazy(() => import('../svg-library/physics/ConcaveMirrorRay'));
const ConvexLensRay = React.lazy(() => import('../svg-library/physics/ConvexLensRay'));
const ConvexMirrorRay = React.lazy(() => import('../svg-library/physics/ConvexMirrorRay'));
const ElectricCircuit = React.lazy(() => import('../svg-library/physics/ElectricCircuit'));
const EyeDefect = React.lazy(() => import('../svg-library/physics/EyeDefect'));
const LensSignConvention = React.lazy(() => import('../svg-library/physics/LensSignConvention'));
const MirrorSignConvention = React.lazy(() => import('../svg-library/physics/MirrorSignConvention'));

// Biology
const HumanBrain = React.lazy(() => import('../svg-library/biology/HumanBrain'));
const HumanDigestiveSystem = React.lazy(() => import('../svg-library/biology/HumanDigestiveSystem'));
const HumanEye = React.lazy(() => import('../svg-library/biology/HumanEye'));
const HumanHeart = React.lazy(() => import('../svg-library/biology/HumanHeart'));
const HumanRespiratorySystem = React.lazy(() => import('../svg-library/biology/HumanRespiratorySystem'));
const Nephron = React.lazy(() => import('../svg-library/biology/Nephron'));
const Neuron = React.lazy(() => import('../svg-library/biology/Neuron'));
const ReflexArc = React.lazy(() => import('../svg-library/biology/ReflexArc'));
const Stomata = React.lazy(() => import('../svg-library/biology/Stomata'));

// Chemistry
const ElectrolysisSetup = React.lazy(() => import('../svg-library/chemistry/ElectrolysisSetup'));
const PhScale = React.lazy(() => import('../svg-library/chemistry/PhScale'));
const TestTubeReaction = React.lazy(() => import('../svg-library/chemistry/TestTubeReaction'));
const UniversalIndicator = React.lazy(() => import('../svg-library/chemistry/UniversalIndicator'));

// Mathematics (Interactive/JSXGraph)
const JSXGraphRenderer = React.lazy(() => import('./JSXGraphRenderer'));
const TikZRenderer = React.lazy(() => import('./TikZRenderer'));

const TEMPLATES = {
  // Mathematics
  'angle': Angle,
  'circle': Circle,
  'construction': Construction,
  'coordinate_plane': CoordinatePlane,
  'line_segment': LineSegment,
  'number_line': NumberLine,
  'parallel_lines': ParallelLines,
  'polygon': Polygon,
  'quadrilateral': Quadrilateral,
  'triangle': Triangle,
  'jsxgraph': JSXGraphRenderer,
  'tikz': TikZRenderer,

  // Physics
  'concave_lens_ray': ConcaveLensRay,
  'concave_mirror_ray': ConcaveMirrorRay,
  'convex_lens_ray': ConvexLensRay,
  'convex_mirror_ray': ConvexMirrorRay,
  'electric_circuit': ElectricCircuit,
  'eye_defect': EyeDefect,
  'lens_sign_convention': LensSignConvention,
  'mirror_sign_convention': MirrorSignConvention,

  // Biology
  'human_brain': HumanBrain,
  'human_digestive_system': HumanDigestiveSystem,
  'human_eye': HumanEye,
  'human_heart': HumanHeart,
  'human_respiratory_system': HumanRespiratorySystem,
  'nephron': Nephron,
  'neuron': Neuron,
  'reflex_arc': ReflexArc,
  'stomata': Stomata,

  // Chemistry
  'electrolysis_setup': ElectrolysisSetup,
  'ph_scale': PhScale,
  'test_tube_reaction': TestTubeReaction,
  'universal_indicator': UniversalIndicator,
};

export default function DiagramRenderer({ diagram }) {
  if (!diagram || !diagram.template) return null;
  const TemplateComponent = TEMPLATES[diagram.template];
  if (!TemplateComponent) {
    return (
      <div style={{ padding: '1rem', border: '1px dashed red', color: 'red' }}>
        Unknown diagram template: {diagram.template}
      </div>
    );
  }
  return (
    <div className="diagram-container" style={{ margin: '1rem 0', textAlign: 'center' }}>
      <Suspense fallback={<div style={{ padding: '2rem', color: '#94a3b8' }}>Loading diagram...</div>}>
        <TemplateComponent data={diagram} />
      </Suspense>
    </div>
  );
}
