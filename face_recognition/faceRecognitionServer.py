from deepface import DeepFace
import os
import requests

import tqdm
import httpimport
import pinecone
import numpy as np
import cv2 


import torch
import torchvision

from flask import Flask, request, abort
import urllib
from uuid import uuid4

INDEX_NAME = 'face-recognition'
INDEX_DIMENSION = 512
global currentImageId

models = [
  "VGG-Face", 
  "Facenet", 
  "Facenet512", 
  "OpenFace", 
  "DeepFace", 
  "DeepID", 
  "ArcFace", 
  "Dlib", 
  "SFace",
]

server = Flask(__name__)
server.debug = True

@server.route("/")
def hello():
    return "Hello, World!"

@server.route("/login", methods=["POST"])
def login():
    global currentImageId
    # for login verification
    # return the nearest entry within the self-set threshold (the lower the better)
    # if beyond threshold, return zero vector
    index = pinecone.Index(INDEX_NAME)

    images = request.json["images"]
    for i in range(len(images)):
        currentImageId = currentImageId + 1
        data = images[i]
        res = urllib.request.urlopen(data)
        image_path = f'./img/{str(currentImageId)}.jpg'
        with open( image_path, 'wb' ) as f:
            f.write(res.file.read())

        # center crop
        # a box with 3 : 4 (center 1.8 : 1.8)
        # height 3 -> 1.8
        # width  4 -> 1.8
        img = cv2.imread(image_path)
        width, height = img.shape[1], img.shape[0]
        mid_x, mid_y = int(width/2), int(height/2)
        crop_width, crop_height = ( width * 3 / 4 ), ( height * 3 / 3 )
        cw2, ch2 = int(crop_width/2), int(crop_height/2) 
        crop_img = img[mid_y-ch2:mid_y+ch2, mid_x-cw2:mid_x+cw2]
        cv2.imwrite(image_path, crop_img)
        print("writing cropped img at {}".format(image_path))
            
        
        currentId, returned_vector, confidence, confThreshold = execute_instruction(index, instruction='query', img_path=image_path)
        # confThreshold = index.fetch([currentId])['vectors']['metadata']['conf_threshold']

        if( confidence <= confThreshold ):
            return vector_post_processing(returned_vector)

    # fail to login
    abort(400)
    

@server.route("/register", methods=["POST"])
def register():
    global currentImageId
    # for account register
    index = pinecone.Index(INDEX_NAME)

    images = request.json["images"]
    currentThreshold = 0
    countThreshold = 0
    for i in range(len(images)):
        currentImageId = currentImageId + 1
        data = images[i]
        res = urllib.request.urlopen(data)
        image_path = f'./img/{str(currentImageId)}.jpg'
        with open( image_path, 'wb' ) as f:
            f.write(res.file.read())

        # center crop
        # a box with 3 : 4 (center 1.8 : 1.8)
        # height 3 -> 1.8
        # width  4 -> 1.8
        img = cv2.imread(image_path)
        width, height = img.shape[1], img.shape[0]
        mid_x, mid_y = int(width/2), int(height/2)
        crop_width, crop_height = ( width * 3 / 4 ), ( height * 3 / 3 )
        cw2, ch2 = int(crop_width/2), int(crop_height/2) 
        crop_img = img[mid_y-ch2:mid_y+ch2, mid_x-cw2:mid_x+cw2]
        cv2.imwrite(image_path, crop_img)
        print("writing cropped img at {}".format(image_path))
            
        if( i == 0 ):
            registerId, returned_vector = execute_instruction(index, instruction='register', img_path=image_path)
        else:
            currentId, queried_vector, confidence, _ = execute_instruction(index, instruction='query', img_path=image_path)
            if( currentId == registerId):
                currentThreshold = currentThreshold + confidence
                countThreshold = countThreshold + 1
        
        
            
    currentThreshold = currentThreshold / countThreshold + 100
    index.update(id=currentId, set_metadata={"conf_threshold": currentThreshold})

    return vector_post_processing(returned_vector)

@server.route("/reset")
def reset():
    # should return all zeros 
    index = pinecone.Index(INDEX_NAME)
    execute_instruction(index, instruction='reset')
    return "hsieh successful"

def execute_instruction(index, instruction, img_path=None):
    index = pinecone.Index(INDEX_NAME)
    # current_vector = extract_embedding(img_path="./img/image58ce78ea-5188-4387-a608-93685938e7e3.jpg")

    if( instruction == "reset" ):
        index.delete(deleteAll='true')
        # should init again out of main function
        return np.zeros(512)
    elif( instruction == "register" ):
        
        current_vector = extract_embedding(img_path=img_path)
        entry_vector = current_vector
        generated_id = 'id' + str(int(sum(entry_vector)*10000))
        # index.upsert([('id1', [1.0, 2.0, 3.0], {'key': 'value'}), ('id2', [1.0, 2.0, 3.0]), ])
        index.upsert([(generated_id , entry_vector, {'conf_threshold': 0})])
        return generated_id, entry_vector
    else:
        # instruction == "query" 
        current_vector = extract_embedding(img_path=img_path)
        response = index.query(current_vector, top_k=1, include_values=True, include_metadata=True)
        # print("response = {}".format(response))
        queried_id = response['matches'][0]['id']
        queried_vector = response['matches'][0]['values']
        confidence = response['matches'][0]['score']
        conf_threshold = response['matches'][0]['metadata']['conf_threshold']


        # print("queried_vector = {}".format(queried_vector))
        # calculate distance and filter those > threshold
        # dist = np.linalg.norm(np.array(current_vector) - np.array(queried_vector))
        # for testing distance
        # return dist, confidence

        return queried_id, queried_vector, confidence, conf_threshold

        # if( confidence <= CONF_THTESHOLD ):
        #     # successful query
        #     return queried_vector
        # else:
        #     # does not match
        #     return np.zeros(512)
        

def extract_embedding(img_path):
    # crop before saving the image to the path 
    # a box with 3 : 4 (center 1.8 : 1.8)
    print("detecting face for imgId = {}".format(currentImageId-1))
    embedding_objs = DeepFace.represent(
        img_path=img_path, 
        model_name=models[2] # Facenet512: 512 dims
    )
    embedding = embedding_objs[0]["embedding"]
    embedding = np.resize( np.array(embedding), (len(embedding) ) )
    # print("size of embedding = {}".format(embedding.shape))

    return embedding.tolist()

def vector_post_processing(vector):
    vector = np.array(vector)
    sigmoid_vector = 1/(1 + np.exp(-vector))
    int_vector = (sigmoid_vector * 256) // 1

    return int_vector.tolist()


if __name__ == '__main__':
    
    currentImageId = 0
    pinecone.init(api_key="",
              environment="")
    server.run(host="0.0.0.0")