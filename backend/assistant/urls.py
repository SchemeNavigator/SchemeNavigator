from django.urls import path
from .views import AssistantMessagesView, AssistantChatView

urlpatterns = [
    path("messages/", AssistantMessagesView.as_view(), name="assistant-messages"),
    path("chat/", AssistantChatView.as_view(), name="assistant-chat"),
]
