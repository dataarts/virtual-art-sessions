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
import json
from django.conf import settings


def load_data():
    raw_data = json.loads(open('data.json', 'rb').read())
    artists = [art['slug'] for art in raw_data['artists']]
    return raw_data, artists

RAW_DATA, ARTISTS_LIST = load_data()


def get_data():
    if settings.DEBUG:
        return load_data()
    return RAW_DATA, ARTISTS_LIST


def get_artists():
    raw_data, _ = get_data()
    return raw_data['artists']


def get_artist(artist_slug):
    return filter(lambda art: art['slug'] == artist_slug, get_artists())[0]


def get_previous_artist(artist_slug):
    _, artists_list = get_data()
    prev_artist_slug_idx = artists_list.index(artist_slug) - 1
    prev_artist_slug = artists_list[prev_artist_slug_idx % len(artists_list)]

    return get_artist(prev_artist_slug)


def get_next_artist(artist_slug):
    _, artists_list = get_data()
    next_artist_slug_idx = artists_list.index(artist_slug) + 1
    next_artist_slug = artists_list[next_artist_slug_idx % len(artists_list)]

    return get_artist(next_artist_slug)


def get_sessions(artist_slug):
    return filter(lambda session: session['enabled'] is True, get_artist(artist_slug)['sessions'])


def get_session(artist_slug, session_slug):
    # can throw IndexError if all sessions are disabled
    sessions = get_sessions(artist_slug)
    return filter(lambda s: s['slug'] == session_slug, sessions)[0]


def get_first_session(artist_slug):
    # can throw IndexError if all sessions are disabled
    artist = get_artist(artist_slug)
    return artist['sessions'][0]


def get_globals():
    raw_data, _ = get_data()
    return raw_data['globals']


def get_full_path(path):
    return '%s%s' % (settings.SITE_URL, path)
