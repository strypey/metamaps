# frozen_string_literal: true
class ApplicationMailer < ActionMailer::Base
  default from: 'team@metamaps.cc'
  layout 'mailer'

  def deliver
    raise NotImplementedError('Please use Mailboxer to send your emails.')
  end

  class << self
    def mail_for_notification(notification)
      if notification.notification_code == MAILBOXER_CODE_ACCESS_REQUEST
        request = notification.notified_object
        MapMailer.access_request_email(request, request.map)
      elsif notification.notification_code == MAILBOXER_CODE_INVITED_TO_EDIT
        map = notification.notified_object
        MapMailer.invite_to_edit_email(map, map.user, 'TODO invited user')
      end
    end
  end
end
