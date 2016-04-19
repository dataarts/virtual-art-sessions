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
from django.conf.urls import patterns, include, url

from . import views


urlpatterns = patterns(
    '',
    url(r'^_ah/', include('djangae.urls')),
    url(r'^csp/', include('cspreports.urls')),

    url(r'^$', views.home, name='home'),
    url(r'^unsupported/$', views.unsupported, name='unsupported'),
    url(r'^serve-file/(?P<blob_key_or_info>.*)/$', views.serve_file, name='serve_file'),
    url(r'^video/(?P<blob_key_or_info>.*)/$', views.video, name='video'),
    url(r'^artists/(?P<artist_slug>[\w-]+)/$', views.session, name='session'),
    url(r'^artists/(?P<artist_slug>[\w-]+)/sessions/(?P<session_slug>[\w-]+)/$', views.session, name='session'),

    url(r'^test/$', views.test, name='test'),
)

handler404 = 'udon.views.handler_404'
handler500 = 'udon.views.handler_500'
