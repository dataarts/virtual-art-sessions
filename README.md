# Virtual Art Sessions

This repository mirrors the active [Virtual Art Sessions](http://g.co/VirtualArtSessions) site (code name Project Udon) and has been opened up with the Apache License 2.0 so that anyone interested can dig around and see how it works. This is meant to accompany the explanations in the [case study](https://developers.google.com/web/showcase/case-study/art-sessions).


## Points of interest

Here are some starting points to help you poke through the code:

- 3D painting & pointcloud engine : /static/src/js/viewer
- Data from artist sessions (all sessions from 5 of the artists) : /data/sketches/
- Sketch viewer/editor : /static/src/js/pages/test.js
- Proxy to serve Cloud Storage media through app engine (work around for DOM 18 exception in some browsers): /sitepackages/djangae/storage.py




## Running the project

This project is built on Google App Engine with [Djangae](https://github.com/potatolondon/djangae).

To get started:

 - Clone this repo (don't forget to change the origin to your own repo!)
 - Run `python ./install_deps` (this will pip install requirements, and download the App Engine SDK)
 - `npm install`
 - `python manage.py runserver`

The install_deps helper script will install dependencies into a 'sitepackages' folder which is added to the path. Each time you run it your
sitepackages will be wiped out and reinstalled with pip. The SDK will only be downloaded the first time (as it's a large download).

## Development

### Environment setup
 - Clone this repo 
 - Run `./install_deps` (this will pip install requirements, and download the App Engine SDK)
 - Install frontend dependencies by running `bower install && npm install`

### Running 
 - Run `python manage.py runserver` to run the application.
 - Run `gulp` in another terminal tab/window to enable compilation and watching of static files for the frontend.

## Deployment

To check security, run:

- `python manage.py checksecure --settings=udon.conf.production`

To build and deploy, run:

    $ ./scripts/deploy.sh

## Troubleshooting

If you are on OS X and using Homebrew-ed Python, you might get the following error when running `./install_deps`:

    error: must supply either home or prefix/exec-prefix -- not both

[This is a known issue](https://github.com/Homebrew/homebrew/blob/master/share/doc/homebrew/Homebrew-and-Python.md#note-on-pip-install---user) and a possible workaround is to make an "empty prefix" by default by adding a `~/.pydistutils.cfg` file with the following contents:

```bash
[install]
prefix=
```

# Working with remote videos
 - run `python ./scripts/download_videos.py`
 - access any view that requires a video and wait for a bit so the video can get uploaded to the local GCS

Note: the delay happens only when you're accessing the video for the first time.

## Code Credits
- Data collection and wrangling - @dataarts
- WebGL viewer - @mflux 
- Site build and Python server - @potatolondon 
