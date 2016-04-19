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
from google.appengine.api.modules.modules import get_current_version_name

ANALYTICS_KEY = 'UA-74361602-1'

########## CACHING CONFIGURATION
from google.appengine.api.modules.modules import get_current_version_name

try:
    CACHES['default']['KEY_PREFIX'] = get_current_version_name()
except KeyError:  # get raised when running checksecure on localhost
    pass

CACHE_TIMEOUT = 61  # seconds

########## END CACHING CONFIGURATION

########## STORAGE CONFIGURATION
BUCKET_KEY = 'udon-media-usa'
########## END STORAGE CONFIGURATION

########## DJANGO SECURE CONFIGURATION
SESSION_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 2592000  # 30 days
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_FRAME_DENY = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_SSL_REDIRECT = True

SECURE_REDIRECT_EXEMPT = [
    # App Engine doesn't use HTTPS internally, so the /_ah/.* URLs need to be exempt.
    # djangosecure compares these to request.path.lstrip("/"), hence the lack of preceding /
    r"^_ah/"
]

SECURE_CHECKS += ["udon.checks.check_csp_sources_not_unsafe"]
########## END DJANGO SECURE CONFIGURATION

DEBUG = False

ALLOWED_HOSTS = [
    '.appspot.com',
    'virtualartsessions.chromeexperiments.com',
    'virtualart.chromeexperiments.com',
]
