# Faceidoor

## Instructions

### Faceidoor server

You must have docker and node >= 18 installed to run this app.

1. create the .env file
```bash
cp .env.example .env
# fill in FEATURE_EXTRACTOR_URL (url of the feature extractor server)
# and AUTHENTICATOR_URL (url of the RPi server)
vim .env
```

2. start the database
```bash
cd ..
docker compose up -d
cd app
```

3. start the server
```bash
# enable pnpm
corepack enable
pnpm install
pnpm dev
```

### Feature extractor server

Pre-installation process:
1. pip install deepface
2. pip install Flask
3. pip install pinecone-client
4. create a pinecone vector database, acquire the #api_key and #environment and type into the "pinecone.init" function

```bash
python3 faceRecognitionServer.py
```

### Rpi and TPM

The main script app.py is written in python, use the flask framework to build as a server. 

We followed FIDO2 and implement mainly four function:
    1. register: create keypair on TPM and use user's face features as the key for the auth_value of TPM, sign the challenge and return public_key, signed_challenge to clients.
    2. login   : receive new challenge, user's face features, and credentials(in this case: username), use the face features to get permission to sign the challenge with private key in TPM, and return the signed_challenge
    3. reset   : reset the TPM with deleting all keypairs. 
    4. unlock  : unlock the TPM if needed

For the unlock function, TPM tends to locked itself after 5 auth_key error. Since one have to complete reset TPM to unlock it, we have to prevent it from locking itself. 

In tpm2_profile's github site, we found the solution to prevent it from locking itself. Link: https://github.com/tpm2-software/tpm2-tss/blob/master/doc/fapi-profile.md

solution: 
    1. first go modified "/etc/tpm2-tss/fapi-profiles/{profile name}.json". In our cases,  "/etc/tpm2-tss/fapi-profiles/P_RSA2048SHA256.json"
    There are two arguments that you can set: 
       1. newMaxTries: it means how many times that you can try to open TPM, default is 5 times. You can set this argument to a large number.
       2. newRecoveryTime(we adopt this setting): TPM would count how many times that you try to open TPM but failed, and if the number reach MaxTries, it will lock itself. RecoveryTime is the time duration that TPM would automatically decrement the times that you failed. We set this argument to 0, so the number would never count to 2.
