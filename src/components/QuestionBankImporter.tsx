import { useState, type ChangeEvent } from "react";
import {
  QuestionTypeEnum,
  type Question,
  type QuestionByType,
  type QuestionType,
} from "../types/questionBanks";
import { saveQuestionBankByRole } from "../utils/indexedDB";
import { keyToType } from "../utils/typeMapper";

interface QuestionBankImporterProps {
  selectedRole: string;
  onImportSuccess: () => void;
}

type ImportMode = "manual" | "file";
type RawQuestion = Partial<Omit<Question, "id">> & {
  type?: string;
  title?: string;
  answer?: string;
  score?: number;
};

export const QuestionBankImporter = ({
  selectedRole,
  onImportSuccess,
}: QuestionBankImporterProps) => {
  const [importMode, setImportMode] = useState<ImportMode>("manual");
  const [manualInput, setManualInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");

  // 生成唯一的题目 ID
  // 使用时间戳 + 随机字符串 + 索引确保唯一性
  const generateQuestionId = (index: number): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `q_${timestamp}_${random}_${index}`;
  };

  const normalizeQuestion = (q: RawQuestion, index: number): Question => ({
    ...q,
    // 自动生成 id，用户不需要提供
    id: generateQuestionId(index),
    type: toQuestionType(q.type ?? QuestionTypeEnum.SingleChoice),
    title: q.title ?? "",
    answer: q.answer ?? "",
    score: q.score ?? 0,
    difficulty: q.difficulty ?? 1,
  });

  function toQuestionType(type: string | number): QuestionType {
    if (typeof type === "number") {
      if (
        type === QuestionTypeEnum.SingleChoice ||
        type === QuestionTypeEnum.MultipleChoice ||
        type === QuestionTypeEnum.TrueFalse ||
        type === QuestionTypeEnum.FillBlank ||
        type === QuestionTypeEnum.ShortAnswer
      ) {
        return type;
      }
      return QuestionTypeEnum.SingleChoice;
    }

    // 尝试英文存储 key
    const fromKey = keyToType(type);
    if (fromKey) return fromKey;

    // 尝试中文 label 映射
    switch (type.trim()) {
      case "单选题":
        return QuestionTypeEnum.SingleChoice;
      case "多选题":
        return QuestionTypeEnum.MultipleChoice;
      case "判断题":
        return QuestionTypeEnum.TrueFalse;
      case "填空题":
        return QuestionTypeEnum.FillBlank;
      case "简答题":
        return QuestionTypeEnum.ShortAnswer;
      default:
        return QuestionTypeEnum.SingleChoice;
    }
  }

  const parseAndValidateQuestions = (
    data: unknown
  ): { success: boolean; questions?: Question[]; error?: string } => {
    try {
      let parsed: unknown;

      if (typeof data === "string") {
        parsed = JSON.parse(data);
      } else if (Array.isArray(data)) {
        parsed = data;
      } else {
        return { success: false, error: "数据格式错误：必须是数组格式" };
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        return { success: false, error: "题目列表不能为空" };
      }

      // 验证每个题目
      const normalizedQuestions: Question[] = [];
      for (let i = 0; i < parsed.length; i++) {
        const q = parsed[i] as RawQuestion;
        // id 字段不需要提供，系统会自动生成
        if (!q.type) {
          return { success: false, error: `第 ${i + 1} 题缺少 type 字段` };
        }
        if (!q.title) {
          return { success: false, error: `第 ${i + 1} 题缺少 title 字段` };
        }
        if (!q.answer) {
          return { success: false, error: `第 ${i + 1} 题缺少 answer 字段` };
        }
        if (
          typeof q.score !== "number" ||
          Number.isNaN(q.score) ||
          q.score <= 0
        ) {
          return {
            success: false,
            error: `第 ${i + 1} 题 score 必须是大于 0 的数字`,
          };
        }

        normalizedQuestions.push(normalizeQuestion(q, i));
      }

      return { success: true, questions: normalizedQuestions };
    } catch (error) {
      return {
        success: false,
        error: `解析失败：${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  };

  const groupQuestionsByType = (questions: Question[]): QuestionByType => {
    const grouped: QuestionByType = {} as QuestionByType;

    questions.forEach((q) => {
      // 保持题目的 type 字段为中文（用于显示）
      // 但在分组时，直接使用中文类型作为 key
      // 存储时会通过 indexedDB 转换为英文 key
      if (!grouped[q.type]) {
        grouped[q.type] = [];
      }
      grouped[q.type].push(q);
    });

    return grouped;
  };

  const handleManualImport = async () => {
    if (!selectedRole) {
      setMessage("请先选择岗位");
      return;
    }

    if (!manualInput.trim()) {
      setMessage("请输入题目数据");
      return;
    }

    setIsImporting(true);
    setMessage("");

    try {
      const result = parseAndValidateQuestions(manualInput);
      if (!result.success || !result.questions) {
        setMessage(result.error || "导入失败");
        setIsImporting(false);
        return;
      }

      // 按题型分组
      const grouped = groupQuestionsByType(result.questions);

      // 保存到 IndexedDB
      await saveQuestionBankByRole(selectedRole, grouped);

      setMessage(`成功导入 ${result.questions.length} 道题目`);
      setManualInput("");
      onImportSuccess();

      // 3秒后清除成功消息
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(
        `导入失败：${error instanceof Error ? error.message : "未知错误"}`
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedRole) {
      setMessage("请先选择岗位");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsImporting(true);
    setMessage("");

    try {
      const text = await file.text();
      const result = parseAndValidateQuestions(text);

      if (!result.success || !result.questions) {
        setMessage(result.error || "导入失败");
        setIsImporting(false);
        return;
      }

      // 按题型分组
      const grouped = groupQuestionsByType(result.questions);

      // 保存到 IndexedDB
      await saveQuestionBankByRole(selectedRole, grouped);

      setMessage(`成功导入 ${result.questions.length} 道题目`);
      onImportSuccess();

      // 清除文件输入
      event.target.value = "";

      // 3秒后清除成功消息
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(
        `导入失败：${error instanceof Error ? error.message : "未知错误"}`
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="question-bank-importer">
      <div className="importer-header">
        <h3>导入题库</h3>
        <div className="mode-selector">
          <button
            className={`mode-button ${importMode === "manual" ? "active" : ""}`}
            onClick={() => setImportMode("manual")}
          >
            手动输入
          </button>
          <button
            className={`mode-button ${importMode === "file" ? "active" : ""}`}
            onClick={() => setImportMode("file")}
          >
            文件导入
          </button>
        </div>
      </div>

      <div className="importer-content">
        {importMode === "manual" ? (
          <div className="manual-input-section">
            <label htmlFor="manual-input">
              请输入 JSON 格式的题目数据（数组格式）
            </label>
            <textarea
              id="manual-input"
              className="manual-textarea"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder={`示例（id 字段不需要提供，系统会自动生成）：\n[\n  {\n    "type": "单选题",\n    "title": "题目内容",\n    "options": ["选项A", "选项B", "选项C", "选项D"],\n    "answer": "选项A",\n    "score": 5,\n    "difficulty": 1\n  },\n  {\n    "type": "判断题",\n    "title": "这是判断题",\n    "answer": "正确",\n    "score": 2\n  }\n]`}
              rows={12}
            />
            <button
              className="import-button"
              onClick={handleManualImport}
              disabled={isImporting || !manualInput.trim()}
            >
              {isImporting ? "导入中..." : "导入题目"}
            </button>
          </div>
        ) : (
          <div className="file-input-section">
            <label htmlFor="file-input" className="file-input-label">
              <span className="file-input-text">选择 JSON 文件</span>
              <input
                id="file-input"
                type="file"
                accept=".json,application/json"
                onChange={handleFileImport}
                disabled={isImporting}
                className="file-input"
              />
            </label>
            <p className="file-hint">
              请选择包含题目数组的 JSON 文件，格式与手动输入相同（id
              字段不需要提供，系统会自动生成）
            </p>
          </div>
        )}

        {message && (
          <div
            className={`import-message ${
              message.includes("成功") ? "success" : "error"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};
