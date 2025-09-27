const axios = require('axios');
const qs = require('querystring');


const API_BASE = 'https://api.clashofclans.com/v1';


module.exports = ({ apiKey }) => {
const client = axios.create({
baseURL: API_BASE,
headers: { Authorization: `Bearer ${apiKey}` }
});


return {
getClan: async (clanTag) => {
const encoded = encodeURIComponent(clanTag.replace('#','%23'));
const res = await client.get(`/clans/${encoded}`);
return res.data;
}
};
};