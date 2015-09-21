# -*- coding: utf-8 -*-
from __future__ import absolute_import, print_function
from webassets.filter import Filter


__all__ = ('BabelJS',)


class BabelJS(Filter):
    name = 'babeljs'
    max_debug_level = None

    def setup(self):
        try:
            import dukpy
        except ImportError:
            raise EnvironmentError('The "dukpy" package is not installed.')
        else:
            self.dukpy = dukpy
        super(BabelJS, self).setup()

    def input(self, _in, out, **kw):
        src = self.dukpy.babel_compile(_in.read())
        out.write(src)
