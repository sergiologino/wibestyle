package ru.wibestyle.api.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import ru.wibestyle.api.config.MailProperties;

@Component
@ConditionalOnProperty(name = "wibestyle.mail.dev-log-only", havingValue = "false")
public class SmtpEmailSender implements EmailSender {

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;

    public SmtpEmailSender(JavaMailSender mailSender, MailProperties mailProperties) {
        this.mailSender = mailSender;
        this.mailProperties = mailProperties;
    }

    @Override
    public void sendOtpCode(String email, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailProperties.getFrom());
        message.setTo(email);
        message.setSubject("Код входа — vibestyle.art");
        message.setText("Ваш код для входа: " + code + "\n\nКод действует несколько минут. Если вы не запрашивали вход — проигнорируйте письмо.");
        mailSender.send(message);
    }
}
