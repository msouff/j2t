from django.views import View
from django.shortcuts import render

import threading


class HomeView(View):

    def get(self, request):

        print("called on HomeView.get()")
        context = {"current_thread": threading.current_thread(),
                   "thread_count": threading.active_count(),
                   "thread_enum": threading.enumerate(),
                   }

        return render(request, 'djangobokeh/home.html', context)
