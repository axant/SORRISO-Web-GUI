About sorriso
=============

Sorriso is a Web Interface for energy consumption on Jemma framework

Installing
----------

Sorriso requires **Python** plus dependencies to build correctly, those can be installed with::

    $ pip install -r requirements.txt

In case you do not have ``pip`` installed, you can get it by running::

    $ curl https://bootstrap.pypa.io/get-pip.py | python

Configuring
-----------

Sorriso needs to connect to various API from the JEMMA system, the endpoint where
those apis are provided is configured inside the ``config.js`` file where all the
configuration options happen.

Compiling
---------

Sorriso compiles to static HTML files so that it can be embedded in any other application
that is able to provide an HTTP server.

To correctly compile sorriso it is necessary to run::

    $ fab build

This will create a ``build`` directory with the static compiled version inside.

Starting Jemma
--------------

Check the Java version: it must be al least 1.8. 

Download Jemma package from Google Drive (https://drive.google.com/open?id=0B5MxqGQ9vE70QTl6Qy1aOEFlb2s) 
Download Fake Values patch (https://drive.google.com/open?id=0B5MxqGQ9vE70OGFkTjBLVDh0TE0).
Copy the patch (it.ismb.pert.osgi.dal.devices.fake_1.1.0.201508301226.jar) inside Jemma -> plugins directory, then:

     $ ./start.sh


Serving for Development and Testing
-----------------------------------

During the development phase it might be preferred to have a testing HTTP Server
and avoid the ``build`` phase.

This can be achieved through the ``fab serve`` command::

    $ fab serve

Which will correctly build and serve sorriso on ``http://localhost:8000/build/home.html``.

The ``serve`` command will automatically open a browser for you and will rebuild sorriso
in case of changes to the source files.

In order to see the page on a mobile device you must edit ``sorriso/config.js``.
Replace ``JEMMA_API_URL`` variable with your IP (or where JEMMA is running).

