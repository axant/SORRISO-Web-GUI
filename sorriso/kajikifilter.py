# -*- coding: utf-8 -*-
from __future__ import absolute_import, print_function
from webassets.filter import Filter


__all__ = ('Kajiki',)


class Kajiki(Filter):
    name = 'kajiki'
    max_debug_level = None
    options = {
        'templates_path': './templates',
        'context': None
    }

    def setup(self):
        try:
            import kajiki
            from kajiki.loader import FileLoader
        except ImportError:
            raise EnvironmentError('The "kajiki" package is not installed.')
        else:
            class ForceReloadFileLoader(FileLoader):
                def import_(self, name, *args, **kwargs):
                    self.modules.pop(name, None)
                    return super(ForceReloadFileLoader, self).import_(name, *args, **kwargs)

            self.kajiki = kajiki
            self.loader = ForceReloadFileLoader([self.templates_path], force_mode='html5')
        super(Kajiki, self).setup()

    def open(self, out, source_path, **kw):
        print('Building', source_path)
        t = self.loader.import_(source_path)
        out.write(t(self.context or {}).render())
