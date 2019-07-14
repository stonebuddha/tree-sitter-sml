#include <tree_sitter/parser.h>
#include <string>
#include <wctype.h>

namespace {

	enum {
		COMMENT,
		STRING_DELIM
	};

	struct Scanner {
		bool in_string;

		Scanner() {
			in_string = false;
		}

		unsigned serialize(char *buffer) {
			*buffer = in_string;
			return 1;
		}

		void deserialize(const char *buffer, unsigned length) {
			in_string = (length > 0) && *buffer;
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

			if (!in_string && valid_symbols[COMMENT] && lexer->lookahead == '(') {
				advance(lexer);
				lexer->result_symbol = COMMENT;
				return scan_comment(lexer);
			} else if (valid_symbols[STRING_DELIM] && lexer->lookahead == '"') {
				advance(lexer);
				in_string = !in_string;
				lexer->result_symbol = STRING_DELIM;
				return true;
			}

			return false;
		}

		void scan_string(TSLexer *lexer) {
			while (true) {
				switch (lexer->lookahead) {
					case '\\':
						advance(lexer);
						advance(lexer);
						break;
					case '"':
						advance(lexer);
						return;
					case '\0':
						if (is_eof(lexer)) return;
						break;
					default:
						advance(lexer);
				}
			}
		}

		char scan_character(TSLexer *lexer) {
			char last = 0;

			switch (lexer->lookahead) {
				case '\\':
					advance(lexer);
					if (iswdigit(lexer->lookahead)) {
						advance(lexer);
						for (size_t i = 0; i < 2; i++) {
							if (!iswdigit(lexer->lookahead)) return 0;
							advance(lexer);
						}
					} else {
						switch (lexer->lookahead) {
							case 'x':
								advance(lexer);
								for (size_t i = 0; i < 2; i++) {
									if (!iswdigit(lexer->lookahead) && (towupper(lexer->lookahead) < 'A' || towupper(lexer->lookahead) > 'F')) return 0;
									advance(lexer);
								}
								break;
							case 'o':
								advance(lexer);
								for (size_t i = 0; i < 3; i++) {
									if (!iswdigit(lexer->lookahead) || lexer->lookahead > '7') return 0;
									advance(lexer);
								}
								break;
							case '\'':
							case '"':
							case '\\':
							case 'n':
							case 't':
							case 'b':
							case 'r':
							case ' ':
								last = (char)lexer->lookahead;
								advance(lexer);
								break;
							default:
								return 0;
						}
					}
					break;
				case '\'':
					break;
				case '\0':
					if (is_eof(lexer)) return 0;
					break;
				default:
					last = (char)lexer->lookahead;
					advance(lexer);
			}

			if (lexer->lookahead == '\'') {
				advance(lexer);
				return 0;
			} else {
				return last;
			}
		}

		bool scan_quoted_string(TSLexer *lexer) {
			std::string id;
			size_t i;

			while (iswlower(lexer->lookahead) || lexer->lookahead == '_') {
				id.push_back((char)lexer->lookahead);
				advance(lexer);
			}

			if (lexer->lookahead != '|') return false;
			advance(lexer);

			while (true) {
				switch (lexer->lookahead) {
					case '|':
						advance(lexer);
						for (i = 0; i < id.size(); i++) {
							if (lexer->lookahead != id[i]) break;
							advance(lexer);
						}
						if (i == id.size() && lexer->lookahead == '}') {
							advance(lexer);
							return true;
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
			char last = 0;

			if (lexer->lookahead != '*') return false;
			advance(lexer);

			while (true) {
				switch (last ? last : lexer->lookahead) {
					case '(':
						if (last) last = 0; else advance(lexer);
						scan_comment(lexer);
						break;
					case '*':
						if (last) last = 0; else advance(lexer);
						if (lexer->lookahead == ')') {
							advance(lexer);
							return true;
						}
						break;
					case '\'':
						if (last) last = 0; else advance(lexer);
						last = scan_character(lexer);
						break;
					case '"':
						if (last) last = 0; else advance(lexer);
						scan_string(lexer);
						break;
					case '{':
						if (last) last = 0; else advance(lexer);
						scan_quoted_string(lexer);
						break;
					case '\0':
						if (is_eof(lexer)) return false;
						break;
					default:
						if (iswalpha(lexer->lookahead) || lexer->lookahead == '_') {
							if (last) last = 0; else advance(lexer);
							while (iswalnum(lexer->lookahead) || lexer->lookahead == '_' || lexer->lookahead == '\'') {
								advance(lexer);
							}
						} else {
							if (last) last = 0; else advance(lexer);
						}
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
