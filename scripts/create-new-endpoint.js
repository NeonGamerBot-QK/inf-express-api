const fs = require('fs');
const path = require('path');
async function processStdin(prompt) {
    if(prompt) console.log(prompt)
    return new Promise((resolve, reject) => {
        process.stdin.resume();
        process.stdin.once('data', data => {
            process.stdin.pause();
            resolve(data.toString().trim());
        });
    })
}
;(async () => {
    const endpointName = await processStdin('Enter the name of the new endpoint:');
    const endpointPath = path.join(__dirname, '..', 'src', 'endpoints', `${endpointName}.js`);
    if(fs.existsSync(endpointPath)) {
        console.log('Endpoint already exists');
        return;
    }
    fs.writeFileSync
    (endpointPath, `// default template 
module.exports = (router, db) => {
    router.all('/', (req,res) => res.send('Hello, world!'))
}
`);
const uploadToGit = await processStdin('Do you want to upload this endpoint to git? (yes/no)');

if(uploadToGit.toLowerCase() === 'yes') {
    const { exec } = require('child_process');
    exec(`git add ${endpointPath} && git commit -m "Added ${endpointName} endpoint"`, (err, stdout, stderr) => {
        if(err) {
            console.error(err);
            return;
        }
        // console.log(stdout);
    });
}


console.log('Endpoint created');
process.exit(0);
})();