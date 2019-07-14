#include <tree_sitter/parser.h>
#include <string>

namespace {

	enum {
		COMMENT,
		STRING,
		CHARACTER
	};

	struct Scanner {
		unsigned serialize(char *buffer) {
			return 0;
		}

		void deserialize(const char *buffer, unsigned length) {
		}

		void advance(TSLexer *lexer) {
			lexer->advance(lexer, false);
		}

		void skip(TSLexer *lexer) {
			lexer->advance(lexer, true);
		}

		bool is_eof(TSLexer *lexer) {
			uint32_t column = lexer->get_column(lexer);
			advance(lexer);
			return lexer->get_column(lexer) <= column;
		}

		bool scan(TSLexer *lexer, const bool *valid_symbols) {
			while (iswspace(lexer->lookahead)) {
				skip(lexer);
			}

			if (valid_symbols[COMMENT] && lexer->lookahead == '(') {
				advance(lexer);
				if (lexer->lookahead != '*') return false;
				advance(lexer);
				lexer->result_symbol = COMMENT;
				return scan_comment(lexer);
			} else if (valid_symbols[STRING] && lexer->lookahead == '"') {
				advance(lexer);
				lexer->result_symbol = STRING;
				return scan_string(lexer);
			} else if (valid_symbols[CHARACTER] && lexer->lookahead == '#') {
				advance(lexer);
				if (lexer->lookahead != '"') return false;
				advance(lexer);
				lexer->result_symbol = CHARACTER;
				return scan_string(lexer);
			}

			return false;
		}

		bool scan_string(TSLexer *lexer) {
			while (true) {
				switch (lexer->lookahead) {
					case '"':
						advance(lexer);
						return true;
					case '\r':
					case '\n':
						return false;
					case '\\':
						advance(lexer);
						if (iswspace(lexer->lookahead)) {
							while (iswspace(lexer->lookahead)) skip(lexer);
							if (lexer->lookahead != '\\') return false;
							advance(lexer);
						} else {
							switch (lexer->lookahead) {
								case 'a':
								case 'b':
								case 'f':
								case 'n':
								case 'r':
								case 't':
								case 'v':
								case '\\':
								case '"':
									advance(lexer);
									break;
								case '^':
									advance(lexer);
									advance(lexer);
									break;
								case 'u':
									advance(lexer);
									advance(lexer);
									advance(lexer);
									advance(lexer);
									advance(lexer);
									break;
								default:
									if (lexer->lookahead >= '0' && lexer->lookahead <= '9') {
										advance(lexer);
										advance(lexer);
										advance(lexer);
									} else {
										return false;
									}
							}
						}
						break;
					case '\0':
						if (is_eof(lexer)) return false;
						break;
					default:
						advance(lexer);
				}
			}
		}

		bool scan_comment(TSLexer *lexer) {
			int lev_comment = 1;

			while (true) {
				switch (lexer->lookahead) {
					case '(':
						advance(lexer);
						if (lexer->lookahead == '*') {
							advance(lexer);
							lev_comment += 1;
						}
						break;
					case '*':
						advance(lexer);
						if (lexer->lookahead == ')') {
							advance(lexer);
							lev_comment -= 1;
							if (!lev_comment) return true;
						}
						break;
					case '\0':
						if (is_eof(lexer)) return false;
						break;
					default:
						advance(lexer);
				}
			}
		}
	};

}

extern "C" {

	void *tree_sitter_standard_ml_external_scanner_create() {
		return new Scanner();
	}

	void tree_sitter_standard_ml_external_scanner_destroy(void *payload) {
		Scanner *scanner = static_cast<Scanner *>(payload);
		delete scanner;
	}

	unsigned tree_sitter_standard_ml_external_scanner_serialize(void *payload, char *buffer) {
		Scanner *scanner = static_cast<Scanner *>(payload);
		return scanner->serialize(buffer);
	}

	void tree_sitter_standard_ml_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
		Scanner *scanner = static_cast<Scanner *>(payload);
		scanner->deserialize(buffer, length);
	}

	bool tree_sitter_standard_ml_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
		Scanner *scanner = static_cast<Scanner *>(payload);
		return scanner->scan(lexer, valid_symbols);
	}

}
