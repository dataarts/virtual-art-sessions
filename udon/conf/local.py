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
from .base import *

from djangae.utils import find_project_root

ANALYTICS_KEY = 'UA-64722660-2'

########## DEBUG CONFIGURATION
DEBUG = True
TEMPLATES[0]['OPTIONS']['debug'] = DEBUG
TEMPLATES[0]['OPTIONS']['loaders'] = DJANGO_TEMPLATE_LOADERS
########## END DEBUG CONFIGURATION

########## STATIC FILES CONFIGURATION
STATIC_URL = '/static/'
########## END STATIC FILES CONFIGURATION

########## CACHING CONFIGURATION
CACHE_TIMEOUT = 0
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}
########## END CACHING CONFIGURATION

# This is required to prevent the 404 handler from dying on devappserver.
ALLOWED_HOSTS = ['*']
