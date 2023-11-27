module.exports = {
  FORMATS: ["png", "jpeg", "jpg", "svg", "gif"],
  MAX_PIXELS: 268402689,
  MIN_HEIGHT: 64,
  MIN_WIDTH: 64,
  THUMBNAILS: {
    small: { size: 160 },
    medium: { size: 640 },
    large: { size: 1060 },
    square: { size: 160, crop: true },
  },
};
