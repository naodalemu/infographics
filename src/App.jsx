import React, { useState, useLayoutEffect, useRef, createRef } from 'react';
import { ChevronUp, ChevronDown, Info } from 'lucide-react';

// --- MOCK JSON DATA ---
// This is the single source of truth for the entire diagram.
// You can modify this object to change the content and structure of the flow.
const processData = {
  sections: {
    stage: "Production Stage",
    inputs: "Inputs",
    productForm: "Product Form",
    losses: "Losses",
  },
  lossDestinations: [
    { id: "dest1", name: "Composting Facility", valueRecovery: "Value recovery 5.00 £/t" },
    { id: "dest2", name: "Animal Feed", valueRecovery: "Value recovery 8.50 £/t" },
    { id: "dest3", name: "Landfill", valueRecovery: "Value recovery 0.00 £/t" },
    { id: "dest4", name: "Anaerobic Digestion", valueRecovery: "Value recovery 6.20 £/t" },
  ],
  stages: [
    {
      id: "stage1",
      title: "Tomato Reception & Sorting",
      description: "Raw tomatoes are received, cleaned, and sorted for quality.",
      inputs: [
        { id: "in1-1", name: "Raw Tomatoes", weight: "2000 kg", cost: "£ 1,000.00" },
        { id: "in1-2", name: "Water (for washing)", weight: "300 kg", cost: "£ 15.00" },
      ],
      productForm: {
        name: "Sorted Tomatoes",
        weight: "1800 kg",
        cost: "£ 950.00",
        units: "",
      },
      losses: [
        { id: "loss1-1", type: "Rotten Tomatoes", weight: "150 kg", cost: "£ 30.00", destinationId: "dest2" },
        { id: "loss1-2", type: "Foreign Materials", weight: "50 kg", cost: "£ 0.00", destinationId: "dest3" },
      ],
    },
    {
      id: "stage2",
      title: "Chopping & Pre-Cooking",
      description: "Tomatoes are chopped and pre-cooked to remove excess water and concentrate flavor.",
      inputs: [],
      productForm: {
        name: "Pre-Cooked Tomato Pulp",
        weight: "1600 kg",
        cost: "£ 1,050.00",
        units: "",
      },
      losses: [
        { id: "loss2-1", type: "Water Evaporation", weight: "100 kg", cost: "£ 0.00", destinationId: "dest3" },
        { id: "loss2-2", type: "Seed & Skin Waste", weight: "100 kg", cost: "£ 20.00", destinationId: "dest1" },
      ],
    },
    {
      id: "stage3",
      title: "Sauce Cooking",
      description: "Pre-cooked pulp is simmered with oil, salt, garlic, and herbs.",
      inputs: [
        { id: "in3-1", name: "Olive Oil", weight: "50 kg", cost: "£ 150.00" },
        { id: "in3-2", name: "Salt & Spices", weight: "10 kg", cost: "£ 25.00" },
      ],
      productForm: {
        name: "Finished Tomato Sauce",
        weight: "1580 kg",
        cost: "£ 1,250.00",
        units: "",
      },
      losses: [
        { id: "loss3-1", type: "Burnt Residue", weight: "20 kg", cost: "£ 5.00", destinationId: "dest1" },
        { id: "loss3-2", type: "Overcooking", weight: "10 kg", cost: "£ 3.00", destinationId: "dest4" },
      ],
    },
    {
      id: "stage4",
      title: "Bottling",
      description: "The cooked sauce is hot-filled into sterilized glass bottles.",
      inputs: [
        { id: "in4-1", name: "Glass Bottles", weight: "700 kg", cost: "£ 560.00" },
        { id: "in4-2", name: "Caps", weight: "70 kg", cost: "£ 50.00" },
      ],
      productForm: {
        name: "Bottled Sauce",
        weight: "1580 kg (sauce) + 770 kg (packaging)",
        cost: "£ 1,860.00",
        units: "",
      },
      losses: [
        { id: "loss4-1", type: "Bottle Breakage", weight: "30 kg", cost: "£ 25.00", destinationId: "dest3" },
        { id: "loss4-2", type: "Spillage During Fill", weight: "20 kg", cost: "£ 10.00", destinationId: "dest4" },
      ],
    },
    {
      id: "stage5",
      title: "Labeling & Final Packing",
      description: "The bottles are labeled, packed into cartons, and prepared for distribution.",
      inputs: [
        { id: "in5-1", name: "Labels", weight: "5 kg", cost: "£ 20.00" },
        { id: "in5-2", name: "Cardboard Boxes", weight: "300 kg", cost: "£ 100.00" },
      ],
      productForm: {
        name: "Packed Tomato Sauce Boxes",
        weight: "2650 kg",
        cost: "£ 1,980.00",
        units: "",
      },
      losses: [
        { id: "loss5-1", type: "Label Misprint", weight: "1 kg", cost: "£ 1.00", destinationId: "dest3" },
        { id: "loss5-2", type: "Box Damage", weight: "10 kg", cost: "£ 5.00", destinationId: "dest1" },
      ],
    },
  ],
};


// --- HELPER COMPONENTS ---

const SectionLabel = ({ children, gridRow, isCollapsible, isExpanded, onToggle }) => (
  <div className="sticky left-0 z-20 bg-gray-50 pr-4 flex items-center justify-end" style={{ gridRow }}>
    {isCollapsible && (
      <div onClick={onToggle} className="cursor-pointer p-1 -mr-1 rounded-full hover:bg-gray-200">
        {isExpanded ? <ChevronUp size={16} className="text-gray-600" /> : <ChevronDown size={16} className="text-gray-600" />}
      </div>
    )}
    <div className="text-right">{children}</div>
  </div>
);

const StageCard = ({ stage, isExpanded }) => {
  return (
    <div className="border-l border-gray-200 px-6">
      <div className="flex items-center text-blue-800 font-semibold">
        <span className="mr-2 h-5 w-5"></span> {/* Spacer */}
        {stage.title}
      </div>
      {isExpanded && <p className="text-xs text-gray-500 mt-1 ml-7">{stage.description}</p>}
    </div>
  );
};

const InputsCard = ({ stage, isExpanded }) => {
    const hasInputs = stage.inputs && stage.inputs.length > 0;

    return (
        <div className="border-l border-gray-200 px-6 pt-4">
            <div className="flex items-center text-gray-700 font-semibold">
                <span className="mr-2 h-5 w-5"></span> {/* Spacer */}
                <span className="ml-1">{stage.inputs.length} Input{stage.inputs.length !== 1 && 's'}</span>
            </div>
            {isExpanded && hasInputs && (
                <div className="mt-2 space-y-2">
                    {stage.inputs.map(input => (
                        <div key={input.id} className="flex justify-between items-center bg-white border border-gray-200 rounded-md p-2 text-sm">
                            <span className="font-medium text-gray-800">{input.name}</span>
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-600">{input.weight}</span>
                                <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">{input.cost}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const ProductFormCard = ({ stage, refs }) => (
  <div className="relative border-l border-gray-200 px-6 flex justify-center items-center">
    <div ref={refs.productForms[stage.id]} className="bg-blue-200 border border-blue-300 rounded-lg p-3 text-center w-48 shadow-sm">
      <p className="font-semibold text-blue-900">{stage.productForm.name}</p>
      <div className="text-sm text-blue-800 mt-1">
        <span>{stage.productForm.weight}</span> | <span>{stage.productForm.cost}</span>
      </div>
      {stage.productForm.units && 
        <div className="flex items-center justify-center text-xs text-blue-700 mt-2 bg-white/70 rounded-full px-2 py-1">
          <Info size={12} className="mr-1" />
          <span>{stage.productForm.units}</span>
        </div>
      }
    </div>
  </div>
);

const LossesSection = ({ stage, refs }) => (
  <div className="border-l border-gray-200 px-6 pt-4">
    <div className="flex justify-around items-start h-full">
      {stage.losses.map(loss => (
        <div key={loss.id} ref={refs.losses[loss.id]} className="text-center text-xs text-gray-600 w-28">
            <p className="font-semibold text-gray-800">[{loss.type}]</p>
            <p className="mt-1">{loss.weight} | {loss.cost}</p>
        </div>
      ))}
    </div>
  </div>
);

const LossDestinationCard = ({ loss, refs }) => (
    <div ref={refs.destinationCards[loss.id]} className="bg-red-100 border border-red-200 rounded-md p-2 text-center text-xs w-32 shadow-sm">
        <p className="font-semibold text-red-800">[{loss.type}]</p>
        <p className="text-red-700 mt-1">{loss.weight} | {loss.cost}</p>
    </div>
);

// --- SVG CONNECTOR COMPONENT ---

const Connectors = ({ data, elementRefs, containerRef }) => {
  const [lines, setLines] = useState([]);

  useLayoutEffect(() => {
    if (!containerRef.current || !elementRefs.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines = [];

    // Lines between product forms
    for (let i = 0; i < data.stages.length - 1; i++) {
        const el1 = elementRefs.current.productForms[data.stages[i].id]?.current;
        const el2 = elementRefs.current.productForms[data.stages[i + 1].id]?.current;

        if (el1 && el2) {
            const rect1 = el1.getBoundingClientRect();
            const rect2 = el2.getBoundingClientRect();

            const start = {
                x: rect1.right - containerRect.left,
                y: rect1.top + rect1.height / 2 - containerRect.top,
            };
            const end = {
                x: rect2.left - containerRect.left,
                y: rect2.top + rect2.height / 2 - containerRect.top,
            };

            newLines.push({
                id: `pf-conn-${data.stages[i].id}`,
                d: `M ${start.x} ${start.y} H ${end.x}`,
                stroke: '#60a5fa',
                arrow: 'main'
            });
        }
    }

    data.stages.forEach(stage => {
      // Vertical line from Product Form to a central point above its losses
      const productFormEl = elementRefs.current.productForms[stage.id]?.current;
      const lossElements = stage.losses.map(l => elementRefs.current.losses[l.id]?.current).filter(Boolean);
      
      if (productFormEl && lossElements.length > 0) {
          const productRect = productFormEl.getBoundingClientRect();
          const firstLossRect = lossElements[0].getBoundingClientRect();
          const lastLossRect = lossElements[lossElements.length - 1].getBoundingClientRect();
          
          const centerX = (firstLossRect.left + lastLossRect.right) / 2 - containerRect.left;

          newLines.push({
              id: `pf-loss-${stage.id}`,
              d: `M ${centerX} ${productRect.bottom - containerRect.top} V ${firstLossRect.top - containerRect.top - 20}`,
              stroke: '#d1d5db',
              arrow: null
          });
      }

      // Lines from Loss to Destination Card
      stage.losses.forEach(loss => {
        const lossEl = elementRefs.current.losses[loss.id]?.current;
        const destEl = elementRefs.current.destinationCards[loss.id]?.current;

        if (lossEl && destEl) {
          const lossRect = lossEl.getBoundingClientRect();
          const destRect = destEl.getBoundingClientRect();

          const start = {
            x: lossRect.left + lossRect.width / 2 - containerRect.left,
            y: lossRect.bottom - containerRect.top,
          };
          const end = {
            x: destRect.left + destRect.width / 2 - containerRect.left,
            y: destRect.top - containerRect.top,
          };
          
          const midY = start.y + 20;

          newLines.push({
            id: `loss-line-${loss.id}`,
            d: `M ${start.x} ${start.y} V ${midY} H ${end.x} V ${end.y}`,
            stroke: '#fca5a5',
            arrow: 'loss'
          });
        }
      });
    });

    setLines(newLines);
  }, [data, elementRefs, containerRef]);

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
      <defs>
        <marker id="arrowhead-loss" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#fca5a5" />
        </marker>
        <marker id="arrowhead-main" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#60a5fa" />
        </marker>
      </defs>
      {lines.map(line => (
        <path
          key={line.id}
          d={line.d}
          stroke={line.stroke}
          strokeWidth="2"
          fill="none"
          markerEnd={line.arrow === 'loss' ? "url(#arrowhead-loss)" : line.arrow === 'main' ? "url(#arrowhead-main)" : null}
        />
      ))}
    </svg>
  );
};


// --- MAIN APP COMPONENT ---

export default function App() {
  const [data] = useState(processData);
  const containerRef = useRef(null);
  
  const [expandedSections, setExpandedSections] = useState({
    stage: true,
    inputs: true,
  });

  const handleToggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const elementRefs = useRef({
    productForms: Object.fromEntries(data.stages.map(s => [s.id, createRef()])),
    losses: Object.fromEntries(data.stages.flatMap(s => s.losses.map(l => [l.id, createRef()]))),
    destinationCards: Object.fromEntries(data.stages.flatMap(s => s.losses.map(l => [l.id, createRef()]))),
  });

  const gridTemplateRows = `auto auto auto 1fr ${data.lossDestinations.map(() => '1fr').join(' ')}`;

  return (
    <div className="bg-gray-50 min-h-screen font-sans p-4 sm:p-8">
        <div className="max-w-full mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Production Process Flow</h1>
            <div className="overflow-x-auto pb-8">
                <div ref={containerRef} className="relative inline-grid gap-y-4" 
                    style={{ 
                        gridTemplateColumns: `150px repeat(${data.stages.length}, 1fr)`,
                        gridTemplateRows: gridTemplateRows
                    }}>
                    
                    {/* Section Labels (First Column) */}
                    <SectionLabel 
                      gridRow="1" 
                      isCollapsible={true} 
                      isExpanded={expandedSections.stage} 
                      onToggle={() => handleToggleSection('stage')}
                    >
                      <span className="font-semibold text-gray-500 text-sm">{data.sections.stage}</span>
                    </SectionLabel>

                    <SectionLabel 
                      gridRow="2" 
                      isCollapsible={true} 
                      isExpanded={expandedSections.inputs} 
                      onToggle={() => handleToggleSection('inputs')}
                    >
                      <span className="font-semibold text-gray-500 text-sm">{data.sections.inputs}</span>
                    </SectionLabel>

                    <SectionLabel gridRow="3">
                      <span className="font-semibold text-gray-500 text-sm">{data.sections.productForm}</span>
                    </SectionLabel>
                    <SectionLabel gridRow="4">
                      <span className="font-semibold text-gray-500 text-sm">{data.sections.losses}</span>
                    </SectionLabel>
                    
                    {data.lossDestinations.map((dest, i) => (
                        <SectionLabel key={dest.id} gridRow={`${5 + i}`}>
                           <div className="text-right">
                             <p className="font-semibold text-gray-600 text-sm">{dest.name}</p>
                             <p className="font-normal text-gray-400 text-xs">{dest.valueRecovery}</p>
                           </div>
                        </SectionLabel>
                    ))}

                    {/* Process Stages (Remaining Columns) */}
                    {data.stages.map((stage, i) => (
                        <React.Fragment key={stage.id}>
                            <div className="min-w-[350px]" style={{ gridColumn: i + 2, gridRow: 1 }}>
                                <StageCard stage={stage} isExpanded={expandedSections.stage} />
                            </div>
                            <div style={{ gridColumn: i + 2, gridRow: 2 }}>
                                <InputsCard stage={stage} isExpanded={expandedSections.inputs} />
                            </div>
                            <div style={{ gridColumn: i + 2, gridRow: 3 }}>
                                <ProductFormCard stage={stage} refs={elementRefs.current} />
                            </div>
                            <div style={{ gridColumn: i + 2, gridRow: 4 }}>
                                <LossesSection stage={stage} refs={elementRefs.current} />
                            </div>
                        </React.Fragment>
                    ))}

                    {/* --- UPDATED LOSS DESTINATIONS LOGIC --- */}
                    {data.lossDestinations.map((dest, destIndex) => (
                      <React.Fragment key={dest.id}>
                        {data.stages.map((stage, stageIndex) => {
                          // This container occupies a single cell in the destination grid
                          return (
                            <div
                              key={`${stage.id}-${dest.id}`}
                              className="flex justify-evenly items-center" // Mimics the layout of the LossesSection
                              style={{
                                gridColumn: stageIndex + 2,
                                gridRow: 5 + destIndex,
                              }}
                            >
                              {/* We loop over ALL losses for the stage to create a matching structure */}
                              {stage.losses.map(loss => {
                                // Only render the card if it belongs in this destination row
                                if (loss.destinationId === dest.id) {
                                  return (
                                    <LossDestinationCard
                                      key={loss.id}
                                      loss={loss}
                                      refs={elementRefs.current}
                                    />
                                  );
                                } else {
                                  // IMPORTANT: Render an invisible placeholder to maintain spacing
                                  return (
                                    <div key={loss.id} className="w-32" /> // Width must match LossDestinationCard
                                  );
                                }
                              })}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                    
                    <Connectors data={data} elementRefs={elementRefs} containerRef={containerRef} />
                </div>
            </div>
        </div>
    </div>
  );
}
