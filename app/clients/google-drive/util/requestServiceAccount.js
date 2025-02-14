const database = require('clients/google-drive/database');

module.exports = async function () {
    const serviceAccounts = await database.serviceAccount.all();

    if (!serviceAccounts || serviceAccounts.length === 0) {
        throw new Error('No service accounts found in the database.');
    }

    // log all the accounts and their free space
    serviceAccounts.forEach((account) => {
        const freeSpace = account.storageQuota.limit - account.storageQuota.usage;
        console.log('Service account:', account.client_id, 'has', freeSpace, 'bytes of free space.');
    });
    
    // Sort service accounts by the available space in descending order
    serviceAccounts.sort((a, b) => {
        const freeSpaceA = parseInt(a.storageQuota.limit) - parseInt(a.storageQuota.usage);
        const freeSpaceB = parseInt(b.storageQuota.limit) - parseInt(b.storageQuota.usage);
        return freeSpaceB - freeSpaceA; // Descending order
    });

    // Select the service account with the most available space
    const selectedClientId = serviceAccounts[0].client_id;
    const selectedFreeSpace = serviceAccounts[0].storageQuota.limit - serviceAccounts[0].storageQuota.usage;

    console.log('Selected service account:', selectedClientId, 'with', selectedFreeSpace, 'bytes of free space.');

    return selectedClientId;
}