import { useState, useCallback } from "react";

// 剔除易混淆字符以提高可读性 (去掉了 0, O, o, 1, l, I)
const CHAR_SETS = {
  lowercase: "abcdefghjkmnpqrstuvwxyz",
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  numbers: "23456789",
  symbols: "!@#$%^&*-+=",
};

const ALL_CHARS =
  CHAR_SETS.lowercase +
  CHAR_SETS.uppercase +
  CHAR_SETS.numbers +
  CHAR_SETS.symbols;

interface UsePasswordGeneratorReturn {
  password: string;
  length: number;
  setLength: (length: number) => void;
  generatePassword: () => string | undefined;
  error: string | null;
}

export function usePasswordGenerator(
  initialLength: number = 12,
): UsePasswordGeneratorReturn {
  // 约束初始长度在 8-16 之间
  const [length, setLengthState] = useState<number>(
    Math.max(8, Math.min(16, initialLength)),
  );
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const setLength = useCallback((newLength: number) => {
    if (newLength < 8 || newLength > 16) {
      setError("密码长度必须在 8 到 16 个字符之间");
    } else {
      setError(null);
    }
    setLengthState(newLength);
  }, []);

  const generatePassword = useCallback(() => {
    if (length < 8 || length > 16) return;

    // 性能优化：一次性申请密码生成和洗牌所需的所有随机数内存
    // 需要的随机数数量 = 选取字符需要的次数 (length) + 洗牌需要的次数 (length)
    const randomBuffer = new Uint32Array(length * 2);
    window.crypto.getRandomValues(randomBuffer);

    let pointer = 0;
    const result: string[] = [];

    // 1. 强制满足必须包含大小写字母、数字和特殊符号的需求
    result.push(
      CHAR_SETS.lowercase[randomBuffer[pointer++] % CHAR_SETS.lowercase.length],
    );
    result.push(
      CHAR_SETS.uppercase[randomBuffer[pointer++] % CHAR_SETS.uppercase.length],
    );
    result.push(
      CHAR_SETS.numbers[randomBuffer[pointer++] % CHAR_SETS.numbers.length],
    );
    result.push(
      CHAR_SETS.symbols[randomBuffer[pointer++] % CHAR_SETS.symbols.length],
    );

    // 2. 填充剩余长度
    for (let i = 4; i < length; i++) {
      result.push(ALL_CHARS[randomBuffer[pointer++] % ALL_CHARS.length]);
    }

    // 3. 高性能 Fisher-Yates 洗牌算法打乱顺序（防止前四个字符总是固定类型）
    for (let i = result.length - 1; i > 0; i--) {
      const j = randomBuffer[pointer++] % (i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }

    const newPwd = result.join("");
    setPassword(newPwd);
    return newPwd;
  }, [length]);

  return { password, length, setLength, generatePassword, error };
}
