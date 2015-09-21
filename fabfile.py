#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import shutil
import glob
import time
import sys
import traceback
import webassets
import webassets.loaders
from watchdog.observers import Observer as _WDObserver
from watchdog.events import FileSystemEventHandler as _FileSystemEventHandler


def build():
    _check_dir()

    print('Building...')
    sys.path.append('sorriso')
    from kajikifilter import Kajiki
    from babelfilter import BabelJS
    import webassets.filter

    webassets.filter.register_filter(BabelJS)

    assets_yml_path = os.path.join('sorriso', 'assets.yml')
    webassets_env = webassets.loaders.YAMLLoader(assets_yml_path).load_environment()
    for f in glob.glob('sorriso/templates/*.xhtml'):
        __, fname = os.path.split(f)
        if fname.startswith('_'):
            continue

        output_file = os.path.join('build', fname.replace('xhtml', 'html'))
        webassets_env.add(webassets.Bundle(f,
                                           filters=Kajiki(
                                               templates_path='sorriso/templates',
                                               context={
                                                   'page': os.path.splitext(fname)[0]
                                               }
                                           ),
                                           output=output_file,
                                           depends=[
                                               webassets.Bundle('sorriso/templates/_layout.xhtml')
                                           ]))
    for bundle in webassets_env:
        bundle.build()

    shutil.rmtree('build/img', ignore_errors=True)
    shutil.copytree('sorriso/img', 'build/img')
    shutil.rmtree('build/fonts', ignore_errors=True)
    shutil.copytree('sorriso/fonts', 'build/fonts')
    print('Done!')


def serve():
    _check_dir()

    def _openbrowser():
        import webbrowser
        time.sleep(1)
        webbrowser.open_new('http://localhost:8000/build/home.html')

    def _serveloop():
        import SimpleHTTPServer
        import SocketServer
        SocketServer.TCPServer.allow_reuse_address = True
        httpd = SocketServer.TCPServer(("", 8000), SimpleHTTPServer.SimpleHTTPRequestHandler)

        import threading
        threading.Thread(target=_openbrowser).start()

        print "serving at port 8000"
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            httpd.shutdown()
            raise

    build()
    _watch(_serveloop)


def watch():
    def _waitloop():
        while True:
            time.sleep(10)
    _watch(_waitloop)


def _watch(func):
    rebuild_handler = _RebuildEventHandler()
    observer = _WDObserver()
    observer.schedule(rebuild_handler, 'sorriso', recursive=True)
    observer.start()

    try:
        print('Watching for file changes...')
        func()
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


def _check_dir():
    assert os.path.exists(os.path.join('sorriso', 'assets.yml')), \
        'Please run fabfile from website root'


class _RebuildEventHandler(_FileSystemEventHandler):
    def on_modified(self, event):
        print('File Changed, rebuilding...')
        try:
            build()
        except:
            print('Failed build')
            traceback.print_exc()
