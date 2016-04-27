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
import logging

import cloudstorage
from djangae.storage import serve_file as djangae_serve_view
from django.conf import settings
from django.core.urlresolvers import reverse
from django.http import Http404
from django.shortcuts import (
    render,
    redirect,
    render_to_response,
)
from django.views.decorators.cache import cache_control
from django.views.decorators.vary import vary_on_headers

from . import utils


@cache_control(public=True, max_age=settings.CACHE_TIMEOUT)
def home(request):
    context = {
        'artists': utils.get_artists(),
    }
    return render(request, 'home.html', context)


@cache_control(public=True, max_age=settings.CACHE_TIMEOUT)
def unsupported(request):
    return render(request, 'unsupported.html', {})


@cache_control(public=True, max_age=settings.CACHE_TIMEOUT)
def session(request, artist_slug, session_slug=None):

    if session_slug is None:
        first_session = utils.get_first_session(artist_slug)
        return redirect(
            reverse(
                'session',
                args=[artist_slug, first_session['slug']],
            )
        )

    try:
        artist = utils.get_artist(artist_slug)
    except (KeyError, IndexError):
        raise Http404

    try:
        session = utils.get_session(artist_slug, session_slug)
    except (KeyError, IndexError):
        raise Http404

    context = {
        'meta': {
            'title': 'Virtual Art Sessions: %s' % artist['name'],
            'description': 'Watch %s paint in virtual reality from any angle at Virtual Art Sessions, '
            'a new Chrome Experiment using Tilt Brush. Created for Google Chrome.' % artist['name'],
            'image': 'img/meta/sessions/%s/%s.jpg' % (artist['slug'], session['slug'])
        },
        'social_share_description': 'Watch %s %s in virtual reality from any '
        'angle with Tilt Brush #VirtualArtSessions %s' % \
        (artist['name'], artist['share_title'], utils.get_full_path(request.path)),
        'previous': utils.get_previous_artist(artist_slug),
        'artist': artist,
        'next': utils.get_next_artist(artist_slug),
        'session': session,
        'sharing_url': utils.get_full_path(request.path)
    }
    return render(request, 'session.html', context)


def test(request):
    return render(request, 'test.html', {})


@cache_control(public=True, max_age=settings.CACHE_TIMEOUT)
def video(request, blob_key_or_info):
    return render(request, 'video.html', {'blob_key_or_info': blob_key_or_info})


@vary_on_headers('Range')
@cache_control(public=True, max_age=settings.CACHE_TIMEOUT)
def serve_file(
    request,
    blob_key_or_info,
    **kwargs
):
    cs_blob_key_or_info = '/{}/{}'.format(settings.BUCKET_KEY, blob_key_or_info)

    def serve():
        return djangae_serve_view(
            request,
            blob_key_or_info=cs_blob_key_or_info,
            **kwargs
        )

    if settings.DEBUG:
        try:
            return serve()
        except cloudstorage.errors.NotFoundError:
            video_path = os.path.join(settings.PROJECT_DIR, 'scripts', 'videos', blob_key_or_info)

            if os.path.exists(video_path):
                logging.info("Creating a local copy...")
                local_file = open(video_path, 'rb')
                local_gcs_file = cloudstorage.open(cs_blob_key_or_info, 'w', content_type='video/mp4')
                local_gcs_file.write(local_file.read())
                local_gcs_file.close()
            else:
                logging.info("File already created. Serving...")

    return serve()


@cache_control(public=True, max_age=settings.CACHE_TIMEOUT)
def handler_404(request):
    return redirect('home')


@cache_control(public=True, max_age=settings.CACHE_TIMEOUT)
def handler_500(request):
    return render_to_response('500.html')
