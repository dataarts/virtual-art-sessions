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
import sys
from os.path import dirname, abspath, join, exists

PROJECT_DIR = dirname(dirname(abspath(__file__)))
SITEPACKAGES_DIR = join(PROJECT_DIR, "sitepackages")
APPENGINE_DIR = join(SITEPACKAGES_DIR, "google_appengine")


def fix_path():
    if exists(APPENGINE_DIR) and APPENGINE_DIR not in sys.path:
        sys.path.insert(1, APPENGINE_DIR)

    if SITEPACKAGES_DIR not in sys.path:
        sys.path.insert(1, SITEPACKAGES_DIR)


def get_app_config():
    """Returns the application configuration, creating it if necessary."""
    from django.utils.crypto import get_random_string
    from google.appengine.ext import ndb

    class Config(ndb.Model):
        """A simple key-value store for application configuration settings."""
        secret_key = ndb.StringProperty()

    # Create a random SECRET_KEY hash
    chars = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)'
    secret_key = get_random_string(50, chars)

    key = ndb.Key(Config, 'config')
    entity = key.get()
    if not entity:
        entity = Config(key=key)
        entity.secret_key = str(secret_key)
        entity.put()
    return entity
