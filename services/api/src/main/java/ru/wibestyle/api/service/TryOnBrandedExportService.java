package ru.wibestyle.api.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;
import ru.wibestyle.api.storage.BlobStorage;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/** Creates owner-only branded downloads. FFmpeg is required only for MP4 exports. */
@Service
public class TryOnBrandedExportService {
    private static final String BRAND = "vibestyle.art";
    private static final String QR_URL = "https://vibestyle.art";
    private final BlobStorage storage;

    public TryOnBrandedExportService(BlobStorage storage) { this.storage = storage; }

    public Path image(UUID userId, UUID sessionId) throws Exception {
        Path source = storage.resolveLocalFile(storage.keyTryOnResult(userId, sessionId, "after"));
        BufferedImage image = ImageIO.read(source.toFile());
        if (image == null) throw new IllegalArgumentException("EXPORT_SOURCE_NOT_FOUND");
        Graphics2D g = image.createGraphics();
        drawBrand(g, image.getWidth(), image.getHeight());
        g.dispose();
        Path target = Files.createTempFile("wibestyle-" + sessionId + "-", ".png");
        ImageIO.write(image, "png", target.toFile());
        return target;
    }

    public Path video(UUID userId, UUID sessionId) throws Exception {
        Path source = storage.resolveLocalFile(storage.keyTryOnVideo(userId, sessionId));
        if (!Files.exists(source)) throw new IllegalArgumentException("EXPORT_SOURCE_NOT_FOUND");
        BufferedImage probe = ImageIO.read(storage.resolveLocalFile(storage.keyTryOnResult(userId, sessionId, "after")).toFile());
        if (probe == null) throw new IllegalArgumentException("EXPORT_SOURCE_NOT_FOUND");
        BufferedImage overlay = new BufferedImage(probe.getWidth(), probe.getHeight(), BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = overlay.createGraphics(); drawBrand(g, overlay.getWidth(), overlay.getHeight()); g.dispose();
        Path overlayFile = Files.createTempFile("wibestyle-overlay-", ".png");
        Path target = Files.createTempFile("wibestyle-" + sessionId + "-", ".mp4");
        ImageIO.write(overlay, "png", overlayFile.toFile());
        Process process = new ProcessBuilder("ffmpeg", "-y", "-i", source.toString(), "-loop", "1", "-i", overlayFile.toString(),
                "-filter_complex", "[0:v][1:v]overlay=0:0:shortest=1[v]", "-map", "[v]", "-map", "0:a?",
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "copy", "-shortest", target.toString())
                .redirectErrorStream(true).start();
        String output = new String(process.getInputStream().readAllBytes());
        Files.deleteIfExists(overlayFile);
        if (process.waitFor() != 0) { Files.deleteIfExists(target); throw new IllegalStateException("EXPORT_VIDEO_FAILED: " + output); }
        return target;
    }

    private static void drawBrand(Graphics2D g, int width, int height) throws Exception {
        int margin = Math.max(18, width / 36), qr = Math.max(88, Math.min(150, width / 6));
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        int badgeH = Math.max(54, width / 13), badgeW = Math.max(180, width / 3), y = height - margin - badgeH;
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, .9f)); g.setColor(Color.WHITE);
        g.fillRoundRect(margin, y, badgeW, badgeH, badgeH, badgeH); g.setComposite(AlphaComposite.SrcOver);
        g.setColor(new Color(255,31,162)); g.fillOval(margin + 12, y + 10, badgeH - 20, badgeH - 20);
        g.setColor(Color.WHITE); g.setFont(new Font("SansSerif", Font.BOLD, badgeH / 2)); g.drawString("V", margin + 25, y + badgeH - 17);
        g.setColor(new Color(48,38,55)); g.setFont(new Font("SansSerif", Font.BOLD, Math.max(18, width / 32))); g.drawString(BRAND, margin + badgeH, y + badgeH / 2 + 8);
        BitMatrix matrix = new QRCodeWriter().encode(QR_URL, BarcodeFormat.QR_CODE, qr, qr);
        BufferedImage code = new BufferedImage(qr, qr, BufferedImage.TYPE_INT_RGB);
        for (int x=0;x<qr;x++) for (int yy=0;yy<qr;yy++) code.setRGB(x, yy, matrix.get(x,yy) ? Color.BLACK.getRGB() : Color.WHITE.getRGB());
        g.fillRoundRect(width-margin-qr-8, height-margin-qr-8, qr+16, qr+16, 16,16); g.drawImage(code, width-margin-qr, height-margin-qr, null);
    }
}
