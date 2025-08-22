/**
 * Crypto Utilities
 *
 * Utilities cho mã hóa, hash password và tạo tokens
 * Sử dụng Bun built-in APIs và Web Crypto API
 */

/**
 * Password hashing sử dụng Bun.password
 */
export class PasswordUtil {
  /**
   * Hash password sử dụng bcrypt algorithm trong Bun
   */
  static async hash(password: string): Promise<string> {
    return await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 12, // Recommended cost factor
    });
  }

  /**
   * Verify password với hash
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    return await Bun.password.verify(password, hash);
  }
}

/**
 * Token generation utilities
 */
export class TokenUtil {
  /**
   * Tạo random token an toàn
   */
  static generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  }

  /**
   * Tạo refresh token
   */
  static generateRefreshToken(): string {
    return this.generateSecureToken(48); // 384 bits
  }

  /**
   * Tạo OTP code
   */
  static generateOTPCode(length: number = 6): string {
    const digits = "0123456789";
    let result = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      result += digits[randomIndex];
    }

    return result;
  }

  /**
   * Tạo API key
   */
  static generateApiKey(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = this.generateSecureToken(16);
    return `fmc_${timestamp}_${randomPart}`;
  }
}

/**
 * Encryption utilities cho sensitive data
 */
export class EncryptionUtil {
  private static algorithm = "AES-GCM";
  private static keyLength = 256;

  /**
   * Tạo encryption key từ string
   */
  static async deriveKey(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      false,
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Mã hóa data
   */
  static async encrypt(
    data: string,
    key: CryptoKey
  ): Promise<{
    encrypted: string;
    iv: string;
  }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);

    const encrypted = await crypto.subtle.encrypt(
      { name: this.algorithm, iv: iv },
      key,
      encoded
    );

    return {
      encrypted: Array.from(new Uint8Array(encrypted))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
      iv: Array.from(iv)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
    };
  }

  /**
   * Giải mã data
   */
  static async decrypt(
    encryptedData: string,
    iv: string,
    key: CryptoKey
  ): Promise<string> {
    const encryptedBytes = new Uint8Array(
      encryptedData.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    const ivBytes = new Uint8Array(
      iv.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: this.algorithm, iv: ivBytes },
      key,
      encryptedBytes
    );

    return new TextDecoder().decode(decrypted);
  }
}

/**
 * Hash utilities cho data integrity
 */
export class HashUtil {
  /**
   * Tạo SHA-256 hash
   */
  static async sha256(data: string): Promise<string> {
    const encoded = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Tạo HMAC signature
   */
  static async hmacSign(data: string, secret: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(data)
    );

    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Verify HMAC signature
   */
  static async hmacVerify(
    data: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    const expectedSignature = await this.hmacSign(data, secret);
    return signature === expectedSignature;
  }
}
