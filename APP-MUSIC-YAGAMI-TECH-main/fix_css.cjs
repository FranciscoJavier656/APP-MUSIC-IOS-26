const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

const cssToAdd = `
.scrubber-input {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
}

.scrubber-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 48px;
  height: 48px;
  background: transparent;
  cursor: pointer;
  border: none;
}

.scrubber-input::-moz-range-thumb {
  width: 48px;
  height: 48px;
  background: transparent;
  cursor: pointer;
  border: none;
}
`;

if (!code.includes('.scrubber-input')) {
  fs.writeFileSync('src/index.css', code + cssToAdd);
  console.log("CSS fixed");
}
