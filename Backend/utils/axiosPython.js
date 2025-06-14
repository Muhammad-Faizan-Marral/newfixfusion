// utils/axiosPython.js
const axios = require('axios');

const getMLSuggestions = async (issueText) => {
  const response = await axios.post('http://localhost:6000/predict', {
    issue: issueText
  });
  return response.data.technicians;
};

module.exports = getMLSuggestions;
