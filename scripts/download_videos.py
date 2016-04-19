#!/usr/bin/env python
"""
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
"""
import os
import json
import urllib2
import sys


remote_url = 'https://storage.googleapis.com/udon-media-usa/'

script_dir = os.path.dirname(os.path.abspath(__file__))
videos_dir = os.path.join(script_dir, 'videos')

resolutions = ['1024_848', '512_424', '256_212']

if not os.path.exists(videos_dir):
    os.makedirs(videos_dir)


data_dir = os.path.join(script_dir, '..', 'data', 'sketches')


def gather_paths():
    paths = []

    for dir in os.listdir(data_dir):
        try:
            meta_file = open(os.path.join(data_dir, dir, 'meta.json'), 'r')
        except IOError:
            continue

        meta_json = json.loads(meta_file.read())
        try:
            for res in resolutions:
                for ext in ['mp4', 'webm']:
                    source = remote_url + meta_json['video']['source'] + '/%s/video.%s' % (res, ext)
                    paths.append(source)

        except KeyError:
            continue

    return paths


for remote_path in gather_paths():
    path = remote_path[remote_path.find('videos'):]
    dir_path, _, file_name = path.rpartition('/')
    local_video_path = os.path.join(videos_dir, dir_path.strip(os.sep))
    if not os.path.exists(local_video_path):
        os.makedirs(local_video_path)

    print "Downloading %s..." % remote_path
    try:
        remote_file = urllib2.urlopen(remote_path)
    except urllib2.HTTPError, e:
        print "File %s not found" % remote_path
        continue


    local_video_path_parts = local_video_path.split('/')
    local_video_path = os.path.join(*local_video_path_parts)
    local_video_path_full = os.path.join(local_video_path, file_name)

    if not sys.platform.startswith('win'):
        local_video_path_full = os.sep + local_video_path_full
    print "Download complete. Writing to %s" % local_video_path_full
    local_file = open(local_video_path_full, 'wb+')
    local_file.write(remote_file.read())
    local_file.close()
