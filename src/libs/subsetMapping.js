// Mapping between subset names and their corresponding query parameter values
export const SUBSET_MAPPING = {
  "Thời sự 60 giây (L21, L22, K01 đến K20)": "L21,L22,K0,K1,K20",
  "Cúp truyền hình 2024 (L23)": "L23",
  "Múa lân (L24)": "L24",
  "Ôn thi THPTQG 2024 (L25)": "L25",
  "Ẩm thực (L26)": "L26",
  "Việt Nam đi là ghiền (L27)": "L27",
  "Mekong (L28, L29)": "L28,L29",
  "Lan tỏa năng lượng tích cực (L30)": "L30",
  "All videos": "" // Empty string means no subset filter
};

// Sub-selection mapping for subsets that have sub-categories
export const SUBSET_SUBSELECTION = {
  "Thời sự 60 giây (L21, L22, K01 đến K20)": {
    "08/2024: L21, L22": "L21,L22",
    "10/2024: K01, K02": "K01,K02",
    "11/2024: K03, K04": "K03,K04",
    "12/2024: K05, K06": "K05,K06",
    "01/2025: K07, K08": "K07,K08",
    "02/2025: K09, K10": "K09,K10",
    "03/2025: K11, K12": "K11,K12",
    "04/2025: K13, K14": "K13,K14",
    "05/2025: K15, K16": "K15,K16",
    "06/2025: K17, K18": "K17,K18",
    "07/2025: K19, K20": "K19,K20"
  }
};

// Get subset value by name
export const getSubsetValue = (subsetName) => {
  return SUBSET_MAPPING[subsetName] || "";
};

// Get all available subset names
export const getAvailableSubsets = () => {
  return Object.keys(SUBSET_MAPPING);
};

// Check if a subset has sub-selections
export const hasSubSelection = (subsetName) => {
  return SUBSET_SUBSELECTION.hasOwnProperty(subsetName);
};

// Get sub-selections for a subset
export const getSubSelections = (subsetName) => {
  return SUBSET_SUBSELECTION[subsetName] || {};
};

// Get sub-selection value by subset and sub-selection name
export const getSubSelectionValue = (subsetName, subSelectionName) => {
  const subSelections = getSubSelections(subsetName);
  return subSelections[subSelectionName] || "";
};

// Get all available sub-selection names for a subset
export const getAvailableSubSelections = (subsetName) => {
  const subSelections = getSubSelections(subsetName);
  return Object.keys(subSelections);
};
