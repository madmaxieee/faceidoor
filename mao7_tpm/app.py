# save this as app.py
from flask import Flask, request, abort
import os
from os  import listdir, system
from os.path import isfile, join 
import json
from tpm2_pytss.FAPI import FAPI
import hashlib
import base64
FEATURES = ""
def get_face(path, description, user_data):
    global FEATURES
    return FEATURES.encode()

#fapi = FAPI()
#fapi.set_auth_callback(callback=get_face, user_data=None)

def sha256_digest(input_string):
    return  hashlib.sha256(input_string).digest()
def tpm_register(username, face_info, challenge):
    with FAPI() as fapi:
        fapi.set_auth_callback(callback=get_face, user_data=None)
        if os.path.isdir(f'/home/pi/.local/share/tpm2-tss/user/keystore/P_RSA2048SHA256/HS/SRK/{username}'): 
            print("username already exists!!!")
            return {} , 1
        print(f'Reginstering: username is => {username}')
        try:
            fapi.create_key(f"/HS/SRK/{username}", "exportable", auth_value=face_info)
        except:
            return {}, 1
        global FEATURES
        FEATURES = face_info
        #signature, public_key, _ = fapi.sign(f"/HS/SRK/{username}", challenge, "rsa_ssa")

        challenge_ = sha256_digest(base64.b64decode(challenge))
        signature, public_key, _ = fapi.sign(f"/HS/SRK/{username}", challenge_, "rsa_ssa")
        post_data = {
        'username': username,
        'public_key': public_key.decode(),
        'signature': base64.b64encode(signature).decode()
        #'credential_id': f'/HS/SRK/{username}'
        }
        return post_data, 0

def tpm_login( username, face_info, challenge):  # credential or username
    with FAPI() as fapi:
        fapi.set_auth_callback(callback=get_face, user_data=None)
        
        global FEATURES
        FEATURES = face_info
        #signature, public_key, _ = fapi.sign(credential_id, challenge, "rsa_ssa")
        challenge_ = sha256_digest(base64.b64decode(challenge))
        path =f'/home/pi/.local/share/tpm2-tss/user/keystore/P_RSA2048SHA256/HS/SRK/{username}'

        print(path)
        if not os.path.isdir(path):  
            print('found no credential!!')
            return {}, 1
        try :
            signature, public_key, _ = fapi.sign(f'/HS/SRK/{username}', challenge_, "rsa_ssa")
        except:
            print('wrong features')
            return {}, 2
        post_data = {
        "signature": base64.b64encode(signature).decode() 
        }
        return post_data, 0

def tpm_reset():
    mypath = '/home/pi/.local/share/tpm2-tss/user/keystore/P_RSA2048SHA256/HS/SRK/'
    onlyfiles = [f for f in listdir(mypath)]
    if len(onlyfiles)==0: return 1 
    for subpath in onlyfiles:
        path = '/HS/SRK/' + subpath
        command = 'tss2_delete --path ' + path
        print(command)
        system(command)
    return 0
def tpm_unlock():
    system('rm -r ~/.local/share/tpm2_tss/user/keystore/*')
    system('rm -r /var/lib/tpm2-tss/system/keystore/*')
    system("tpm2_clear")
    system('tss2_provision')

app = Flask(__name__)

@app.route("/")
def hello():
    return "FACEiDOOR!"


@app.route('/register', methods=['POST'])
def register():
    json_input = request.json 
    username  = json_input['username']
    face_info = json_input['features']
    challenge = json_input['challenge']
    post_data, status = tpm_register(username, face_info, challenge) 
    if status:  # username already exists
        abort(401)
    return post_data

@app.route('/login', methods=['POST'])
def login():
    json_input = request.json
    username  = json_input['username']
    #credential= json_input['credential']
    face_info = json_input['features']
    challenge = json_input['challenge']
    post_data , status = tpm_login(username, face_info, challenge)

    if status==1   : abort(401) #wrong credential
    elif status ==2: abort(404) #wrong features
    return post_data
@app.route("/reset", methods=['get'])
def reset():
    
    status = tpm_reset()
    
    if status: strr = "No more key to reset now!"
    else: strr = "successfully reset!"
    print(strr)
    return strr

@app.route("/unlock",methods=['get'])
def unlock():
    tpm_reset()
    tpm_unlock()
    return "unlocked" 
if __name__ == '__main__':
    app.run(host="0.0.0.0")
