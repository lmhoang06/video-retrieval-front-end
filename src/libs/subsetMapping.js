// Mapping between subset names and their corresponding query parameter values
export const SUBSET_MAPPING = {
  "Thời sự 60 giây": "L21,L22,K0,K1,K20",
  "Cúp truyền hình 2024": "L23",
  "Múa lân": "L24",
  "Ôn thi THPTQG 2024": "L25",
  "Ẩm thực": "L26",
  "Việt Nam đi là ghiền": "L27",
  "Mekong": "L28,L29",
  "Lan tỏa năng lượng tích cực": "L30",
  "All videos": "" // Empty string means no subset filter
};

// Get subset value by name
export const getSubsetValue = (subsetName) => {
  return SUBSET_MAPPING[subsetName] || "";
};

// Get all available subset names
export const getAvailableSubsets = () => {
  return Object.keys(SUBSET_MAPPING);
};
