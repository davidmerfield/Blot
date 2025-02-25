const config = require('config');
const MAC_SERVER_ADDRESS = config.icloud.server_address;
const clfdate = require('helper/clfdate');

module.exports = async () =>{
    console.log(clfdate(), 'Connecting to mac server...');
    try {
        const res = await fetch(MAC_SERVER_ADDRESS + "/ping");
        const text = await res.text();
        console.log(clfdate(), 'Connected to mac server: ', text);    
    } catch (error) {
        console.log(clfdate(), 'Error connecting to mac server: ', error);
    }
}