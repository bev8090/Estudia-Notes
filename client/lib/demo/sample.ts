// Pre-generated study guide for the demo's "See a sample" option, so viewing it is
// instant and costs nothing. Generated once by the real AI from these sample notes
// (server/scripts/smoke-ai.ts uses the same notes).
import type { Topic } from "@/lib/types";

export type DemoGuide = { overview: string; examPriorities: string[]; topics: Topic[] };

export const SAMPLE: { title: string; notes: string; guide: DemoGuide } = {
  "title": "Cellular Respiration and Fermentation",
  "notes": "Biology 101 - Lecture 4: Cellular Respiration\n\nCellular respiration = how cells turn glucose into usable energy (ATP).\nOverall: C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O + ~30-32 ATP\n\nStage 1: Glycolysis\n- happens in the cytoplasm, no oxygen needed (anaerobic)\n- 1 glucose -> 2 pyruvate, net gain 2 ATP + 2 NADH\n\nStage 2: Krebs cycle (citric acid cycle)\n- in mitochondrial matrix\n- pyruvate first converted to acetyl-CoA (releases CO2)\n- each turn makes NADH, FADH2, 1 ATP, releases CO2\n- cycle turns twice per glucose\n\nStage 3: Electron transport chain (ETC)\n- inner mitochondrial membrane\n- NADH + FADH2 drop off electrons, pumps H+ ions -> gradient\n- ATP synthase uses the H+ gradient to make most of the ATP (oxidative phosphorylation)\n- O2 is the final electron acceptor -> forms water. no O2 = ETC stops\n\nFermentation: when no oxygen, cells use fermentation to regenerate NAD+ so glycolysis can keep going.\nLactic acid fermentation in muscles, alcoholic fermentation in yeast. Only 2 ATP per glucose.",
  "guide": {
    "overview": "These notes cover how cells convert glucose into ATP through cellular respiration, which has three stages: glycolysis, the Krebs cycle, and the electron transport chain. Early stages produce electron carriers (NADH, FADH2) that feed the electron transport chain, where most ATP is made and oxygen is required. When oxygen is absent, fermentation lets glycolysis continue by regenerating NAD+, but yields far less ATP.",
    "examPriorities": [
      "Know the overall equation of cellular respiration: C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O + ~30-32 ATP.",
      "Know the three stages in order, with the location of each: glycolysis (cytoplasm), Krebs cycle (mitochondrial matrix), electron transport chain (inner mitochondrial membrane).",
      "Know that the ETC and ATP synthase make most of the ATP through oxidative phosphorylation, using an H+ gradient.",
      "Know that O2 is the final electron acceptor and forms water, and that without O2 the ETC stops.",
      "Know the glycolysis products: 1 glucose -> 2 pyruvate, with a net gain of 2 ATP and 2 NADH.",
      "Know why fermentation happens (to regenerate NAD+ so glycolysis can continue), its two types (lactic acid in muscles, alcoholic in yeast), and that it yields only 2 ATP per glucose.",
      "Know what the Krebs cycle produces and that it turns twice per glucose."
    ],
    "topics": [
      {
        "id": "sample-topic-1",
        "name": "Overview of Cellular Respiration",
        "importance": "HIGH",
        "keyPoints": [
          "Cellular respiration is the process by which cells turn glucose into usable energy in the form of ATP.",
          "The overall equation is C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O + ~30-32 ATP, so glucose and oxygen are consumed while carbon dioxide, water, and ATP are produced.",
          "The process occurs in three stages: glycolysis, the Krebs cycle, and the electron transport chain.",
          "The early stages generate electron carriers (NADH and FADH2) that the electron transport chain uses, which is why the stages are linked."
        ],
        "keyTerms": [
          {
            "term": "Cellular respiration",
            "definition": "How cells turn glucose into usable energy (ATP)."
          }
        ],
        "examTips": [
          "Be able to write the overall equation of cellular respiration and identify the reactants and products.",
          "Be able to list the three stages of cellular respiration in order.",
          "Be able to state the approximate total ATP yield (~30-32 ATP per glucose)."
        ],
        "pitfalls": []
      },
      {
        "id": "sample-topic-2",
        "name": "Stage 1: Glycolysis",
        "importance": "HIGH",
        "keyPoints": [
          "Glycolysis takes place in the cytoplasm, not in the mitochondria.",
          "It does not need oxygen, so it is anaerobic.",
          "One glucose molecule is converted into 2 pyruvate.",
          "The net gain is 2 ATP and 2 NADH; the NADH carries electrons that can later be used in the electron transport chain.",
          "Pyruvate from glycolysis goes on to be converted to acetyl-CoA before entering the Krebs cycle."
        ],
        "keyTerms": [
          {
            "term": "Glycolysis",
            "definition": "The first stage of cellular respiration, in the cytoplasm, converting 1 glucose into 2 pyruvate with a net gain of 2 ATP and 2 NADH; needs no oxygen."
          },
          {
            "term": "Anaerobic",
            "definition": "Not requiring oxygen."
          }
        ],
        "examTips": [
          "Be able to state where glycolysis occurs and whether it requires oxygen.",
          "Be able to give the inputs and net outputs of glycolysis (1 glucose -> 2 pyruvate, net 2 ATP + 2 NADH).",
          "Be able to explain why glycolysis can continue without oxygen only if NAD+ is regenerated."
        ],
        "pitfalls": [
          "Do not confuse the net gain of 2 ATP in glycolysis with the ~30-32 ATP total from the whole process."
        ]
      },
      {
        "id": "sample-topic-3",
        "name": "Stage 2: Krebs Cycle (Citric Acid Cycle)",
        "importance": "HIGH",
        "keyPoints": [
          "The Krebs cycle takes place in the mitochondrial matrix.",
          "Before the cycle, pyruvate is converted to acetyl-CoA, which releases CO2.",
          "Each turn of the cycle makes NADH, FADH2, and 1 ATP, and releases CO2.",
          "The cycle turns twice per glucose, because each glucose gives two pyruvate.",
          "The NADH and FADH2 produced carry electrons to the electron transport chain."
        ],
        "keyTerms": [
          {
            "term": "Krebs cycle (citric acid cycle)",
            "definition": "The second stage of cellular respiration, in the mitochondrial matrix; each turn makes NADH, FADH2, and 1 ATP and releases CO2."
          },
          {
            "term": "Acetyl-CoA",
            "definition": "The molecule pyruvate is first converted into (releasing CO2) before entering the Krebs cycle."
          }
        ],
        "examTips": [
          "Be able to state where the Krebs cycle occurs and what each turn produces.",
          "Be able to explain what happens to pyruvate before it enters the cycle.",
          "Be able to state how many times the cycle turns per glucose."
        ],
        "pitfalls": [
          "The cycle turns twice per glucose, not once; per-turn products must be doubled when counting per glucose.",
          "Keep locations straight: glycolysis is in the cytoplasm, while the Krebs cycle is in the mitochondrial matrix."
        ]
      },
      {
        "id": "sample-topic-4",
        "name": "Stage 3: Electron Transport Chain and Oxidative Phosphorylation",
        "importance": "HIGH",
        "keyPoints": [
          "The electron transport chain (ETC) is located in the inner mitochondrial membrane.",
          "NADH and FADH2 drop off their electrons at the chain, and this process pumps H+ ions, building up a gradient.",
          "ATP synthase uses the H+ gradient to make most of the cell's ATP; this is called oxidative phosphorylation.",
          "O2 is the final electron acceptor, and combining with electrons forms water.",
          "Without O2 the ETC stops, so the ATP production that depends on it also halts."
        ],
        "keyTerms": [
          {
            "term": "Electron transport chain (ETC)",
            "definition": "The third stage of cellular respiration, in the inner mitochondrial membrane, where NADH and FADH2 drop off electrons and H+ ions are pumped to form a gradient."
          },
          {
            "term": "ATP synthase",
            "definition": "The enzyme that uses the H+ gradient to make most of the ATP."
          },
          {
            "term": "Oxidative phosphorylation",
            "definition": "ATP production by ATP synthase using the H+ gradient."
          },
          {
            "term": "Final electron acceptor",
            "definition": "O2, which forms water when it accepts electrons."
          }
        ],
        "examTips": [
          "Be able to describe the steps of the ETC: electron drop-off, H+ pumping, gradient formation, and ATP synthesis by ATP synthase.",
          "Be able to explain the role of O2 and what happens when it is absent.",
          "Be able to identify which stage produces most of the ATP and where it takes place."
        ],
        "pitfalls": [
          "Do not mix up the products: the Krebs cycle makes only 1 ATP per turn, while the ETC (via ATP synthase) makes most of the ATP.",
          "O2 is the final electron acceptor and forms water; it is not the molecule that is pumped or that drives the gradient directly."
        ]
      },
      {
        "id": "sample-topic-5",
        "name": "Fermentation",
        "importance": "MEDIUM",
        "keyPoints": [
          "When there is no oxygen, cells use fermentation, because the ETC cannot run without O2.",
          "The purpose of fermentation is to regenerate NAD+ so glycolysis can keep going.",
          "Lactic acid fermentation occurs in muscles.",
          "Alcoholic fermentation occurs in yeast.",
          "Fermentation yields only 2 ATP per glucose, far less than the ~30-32 ATP from full cellular respiration."
        ],
        "keyTerms": [
          {
            "term": "Fermentation",
            "definition": "A process used when there is no oxygen to regenerate NAD+ so that glycolysis can keep going."
          },
          {
            "term": "Lactic acid fermentation",
            "definition": "Fermentation that occurs in muscles."
          },
          {
            "term": "Alcoholic fermentation",
            "definition": "Fermentation that occurs in yeast."
          }
        ],
        "examTips": [
          "Be able to explain why cells use fermentation and what it regenerates.",
          "Be able to name the two types of fermentation and where each occurs.",
          "Be able to compare the ATP yield of fermentation (2 ATP) with cellular respiration (~30-32 ATP)."
        ],
        "pitfalls": [
          "Fermentation does not itself make much ATP; it keeps glycolysis running by regenerating NAD+, and the 2 ATP come from glycolysis."
        ]
      }
    ]
  }
};
