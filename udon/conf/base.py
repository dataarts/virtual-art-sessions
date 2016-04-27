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
"""
Django settings for udon project.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.6/ref/settings/
"""

from djangae.settings_base import *  # set up some AppEngine specific stuff
from djangae.utils import find_project_root
from django.core.urlresolvers import reverse_lazy
from google.appengine.api.app_identity.app_identity import get_default_gcs_bucket_name

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
PROJECT_DIR = find_project_root()

SITE_URL = "https://virtualart.chromeexperiments.com"
SHORT_URL = "g.co/VirtualArtSessions"

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.6/howto/deployment/checklist/

from ..boot import get_app_config
# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = get_app_config().secret_key

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# Application definition

INSTALLED_APPS = (
    'djangae',  # Djangae needs to come before django apps in django 1.7 and above
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    'djangosecure',
    'csp',
    'cspreports',
    'djangae.contrib.security',
    'udon'
)

MIDDLEWARE_CLASSES = (
    'djangae.contrib.security.middleware.AppEngineSecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
    'csp.middleware.CSPMiddleware',
    'djangosecure.middleware.SecurityMiddleware',
)

DJANGO_TEMPLATE_LOADERS = [
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader'
]

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [os.path.join(PROJECT_DIR, 'static', 'dist')],
    'OPTIONS': {
        'debug': DEBUG,
        'loaders': [
            ('django.template.loaders.cached.Loader', DJANGO_TEMPLATE_LOADERS),
        ],
        'context_processors': (
            "django.core.context_processors.debug",
            "django.core.context_processors.i18n",
            "django.core.context_processors.media",
            "django.core.context_processors.static",
            "django.core.context_processors.tz",
            "django.core.context_processors.request",
            "udon.context_processor.context_processor"
        )
    },
}]

SECURE_CHECKS = [
    "djangosecure.check.sessions.check_session_cookie_secure",
    "djangosecure.check.sessions.check_session_cookie_httponly",
    "djangosecure.check.djangosecure.check_security_middleware",
    "djangosecure.check.djangosecure.check_sts",
    "djangosecure.check.djangosecure.check_frame_deny",
    "djangosecure.check.djangosecure.check_ssl_redirect",
    "udon.checks.check_csp_is_not_report_only"
]

CSP_REPORT_URI = reverse_lazy('report_csp')
CSP_REPORTS_LOG = True
CSP_REPORTS_LOG_LEVEL = 'warning'
CSP_REPORTS_SAVE = True
CSP_REPORTS_EMAIL_ADMINS = False

ROOT_URLCONF = 'udon.urls'

WSGI_APPLICATION = 'udon.wsgi.application'


# Internationalization
# https://docs.djangoproject.com/en/1.6/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.6/howto/static-files/
STATIC_URL = '/static/'

# sensible default CPS settings, feel free to modify them
CSP_DEFAULT_SRC = (
    "'self'",
    "*.gstatic.com",
    "https://project-udon.appspot.com",
    "storage.googleapis.com",
    "http://virtualartsessions.chromeexperiments.com.global.prod.fastly.net",
    "https://virtualartsessions.global.ssl.fastly.net",
)
CSP_STYLE_SRC = (
    "'self'",
    "'unsafe-inline'",
    "https://fonts.googleapis.com",
    "https://*.gstatic.com",
    "use.typekit.net",
    "https://use.typekit.net",
)
CSP_FONT_SRC = (
    "'self'",
    "themes.googleusercontent.com",
    "https://*.gstatic.com",
    "data:",
)
CSP_FRAME_SRC = (
    "'self'",
    "https://www.youtube.com",
    "www.google.com",
    "accounts.google.com",
    "apis.google.com",
    "plus.google.com",
)
CSP_SCRIPT_SRC = (
    "'self'",
    "'unsafe-inline'",
    "https://www.youtube.com",
    "https://s.ytimg.com",
    "*.googleanalytics.com",
    "*.google-analytics.com",
    "ajax.googleapis.com",
    "*.gstatic.com",
    "use.typekit.net",
    "https://use.typekit.net",
)
CSP_IMG_SRC = (
    "'self'",
    "data:",
    "s.ytimg.com",
    "*.google-analytics.com",
    "*.googleusercontent.com",
    "*.gstatic.com",
    "p.typekit.net",
    "https://p.typekit.net",
)
CSP_CONNECT_SRC = (
    "'self'",
    "plus.google.com",
    "www.google-analytics.com",
)

BUCKET_KEY = get_default_gcs_bucket_name()

DEFAULT_FILE_STORAGE = 'google.appengine.api.blobstore.blobstore_stub.BlobStorage'

DJANGAE_RUNSERVER_IGNORED_FILES_REGEXES = [
    '^.+$(?<!\.py)(?<!\.yaml)(?<!\.html)',
]

# Note that these should match a directory name, not directory path:
DJANGAE_RUNSERVER_IGNORED_DIR_REGEXES = [
    r"^google_appengine$",
    r"^bower_components$",
    r"^node_modules$",
    r"^sitepackages$",
]
