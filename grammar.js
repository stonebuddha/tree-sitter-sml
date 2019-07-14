module.exports = grammar({
	name: 'standard_ml',

	rules: {
		source_file: $ => repeat($._sdec),

		// Top-level declarations

		_sdec: $ => choice(
			$.structure_dec,
			// $.signature_dec,
			// $.funsig_dec,
			// $.functor_dec,
			// $.local_top_dec,
			$._ldec,
		),

		structure_dec: $ => seq(
			'structure',
			$._struct_bind,
			repeat(seq('and', $._struct_bind)),
		),

		_struct_bind: $ => seq(
			$._full_ident,
			'=',
			$._struct,
		),

		_struct: $ => choice(
			// $.ident_struct,
			$.base_struct,
			// $.app_struct,
			// $.let_struct,
		),

		base_struct: $ => seq(
			'struct',
			repeat(choice(';', $._strdec)),
			'end',
		),

		_strdec: $ => choice(
			$.structure_dec_strdec,
			// $.functor_dec_strdec,
			$.local_dec_strdec,
			$._ldec,
		),

		structure_dec_strdec: $ => seq(
			'structure',
			$._struct_bind_strdec,
			repeat(seq('and', $._struct_bind_strdec)),
		),

		_struct_bind_strdec: $ => seq(
			$._full_ident,
			'=',
			$._struct,
		),

		local_dec_strdec: $ => seq(
			'local',
			repeat(choice(';', $._strdec)),
			'in',
			repeat(choice(';', $._strdec)),
			'end',
		),

		_ldec: $ => choice(
			$.val_dec,
			$.fun_dec,
			$.ty_dec,
			// $.dty_repl_dec,
			$.dty_dec,
			// $.absty_dec,
			$.exception_dec,
			$.open_dec,
			$.fixity_dec,
		),

		// Value declarations

		val_dec: $ => seq(
			'val',
			optional($._tyvar_seq),
			optional('rec'),
			$._val_bind,
			repeat(seq('and', $._val_bind)),
		),

		_val_bind: $ => seq(
			$._pat,
			'=',
			$._exp,
		),

		// Function declarations

		fun_dec: $ => seq(
			'fun',
			optional($._tyvar_seq),
			$._fun_bind,
			repeat(seq('and', $._fun_bind)),
		),

		_fun_bind: $ => seq($._clause, repeat(seq('|', $._clause))),

		_clause: $ => seq(
			repeat1($._apat),
			optional($._constraint),
			'=',
			$._exp
		),

		_constraint: $ => seq(':', $._ty),

		// Type declarations

		ty_dec: $ => seq(
			'type',
			$._ty_bind,
			repeat(seq('and', $._ty_bind)),
		),

		_ty_bind: $ => seq(
			optional($._tyvar_seq),
			$._full_ident,
			'=',
			$._ty,
		),

		// Datatype declarations

		dty_dec: $ => seq(
			'datatype',
			$._dty_bind,
			repeat(seq('and', $._dty_bind)),
			optional(
				seq(
					'withtype',
					$._ty_bind,
					repeat(seq('and', $._ty_bind)),
				),
			),
		),

		_dty_bind: $ =>	seq(
			optional($._tyvar_seq),
			$._full_ident,
			'=',
			$._constr,
			repeat(seq('|', $._constr)),
		),

		_constr: $ => seq(
			optional('op'),
			$._full_ident,
			optional(seq('of', $._ty)),
		),

		// Exception declarations

		exception_dec: $ => seq(
			'exception',
			$._exn_bind,
			repeat(seq('and', $._exn_bind)),
		),

		_exn_bind: $ => seq(
			$._full_ident,
			optional(choice($.exn_gen, $.exn_repl)),
		),

		exn_gen: $ => seq('of', $._ty),

		exn_repl: $ => seq('=', $._full_ident, repeat(seq('.', $._full_ident))),

		// Misc declarations

		open_dec: $ => seq(
			'open',
			repeat1(seq($._full_ident, repeat(seq('.', $._full_ident)))),
		),

		fixity_dec: $ => seq(
			choice(seq(choice('infix', 'infixr'), optional(/\d+/)), 'nonfix'),
			repeat1($._full_ident),
		),

		// Patterns

		_pat: $ => choice(
			$.as_pat,
			$.constraint_pat,
			$.app_pat,
		),

		as_pat: $ => prec.right(seq($._pat, 'as', $._pat)),

		constraint_pat: $ => seq($._pat, ':', $._ty),

		app_pat: $ => repeat1($._apat),

		_apat: $ => choice(
			$.__apat,
			seq('(', $._pat, ')'),
			$.ident_pat,
			$.unit_tuple_pat,
			$.tuple_pat,
			$.or_pat,
		),

		ident_pat: $ => $._full_ident,

		unit_tuple_pat: $ => seq('(', ')'),

		tuple_pat: $ => seq('(', $._pat, repeat1(seq(',', $._pat)), ')'),

		or_pat: $ => seq('(', $._pat, repeat1(seq('|', $._pat)), ')'),

		__apat: $ => choice(
			seq('op', $.ident_pat),
			$.access_pat,
			$.constant_pat,
			$.wild_pat,
			$.list_pat,
			$.vector_pat,
			$.unit_rec_pat,
			$.rec_pat,
		),

		access_pat: $ => seq(
			optional('op'),
			$._full_ident,
			repeat1(seq('.', $._full_ident)),
		),

		constant_pat: $ => $._constant,

		wild_pat: $ => '_',

		list_pat: $ => choice(
			seq('[', ']'),
			seq('[', $._pat, repeat(seq(',', $._pat)), ']'),
		),

		vector_pat: $ => choice(
			seq('#[', ']'),
			seq('#[', $._pat, repeat(seq(',', $._pat)), ']'),
		),

		unit_rec_pat: $ => seq('{', '}'),

		rec_pat: $ => seq('{', $._plabels, '}'),

		_plabels: $ => choice(
			seq($._plabel, ',', $._plabels),
			$._plabel,
			'...',
		),

		_plabel: $ => choice(
			seq($.selector, '=', $._pat),
			seq(
				$._full_ident,
				optional(seq(':', $._ty)),
				optional(seq('as', $._pat)),
			),
		),

		// Matches

		// TODO: check me!
		_match: $ => prec.right(seq($._rule, repeat(seq('|', $._rule)))),

		_rule: $ => prec.right(seq($._pat, '=>', $._exp)),

		// Expressions

		_exp: $ => choice(
			$.handle_exp,
			$.orelse_exp,
			$.andalso_exp,
			$.constraint_exp,
			$.app_exp,
			$.fn_exp,
			$.case_exp,
			$.while_exp,
			$.if_exp,
			$.raise_exp,
		),

		handle_exp: $ => prec.right(seq($._exp, 'handle', $._match)),

		orelse_exp: $ => prec.right(seq($._exp, 'orelse', $._exp)),

		andalso_exp: $ => prec.right(seq($._exp, 'andalso', $._exp)),

		constraint_exp: $ => seq($._exp, ':', $._ty),

		app_exp: $ => repeat1(choice($._aexp, $.ident_exp)),

		fn_exp: $ => seq('fn', $._match),

		case_exp: $ => seq('case', $._exp, 'of', $._match),

		while_exp: $ => prec.left(seq('while', $._exp, 'do', $._exp)),

		if_exp: $ => prec.left(seq('if', $._exp, 'then', $._exp, 'else', $._exp)),

		raise_exp: $ => prec.left(seq('raise', $._exp)),

		ident_exp: $ => $._full_ident,

		_aexp: $ => choice(
			seq('op', $.ident_exp),
			$.access_exp,
			$.constant_exp,
			$.selector_exp,
			$.rec_exp,
			$.rec_unit_exp,
			$.tuple_unit_exp,
			$.seq_exp,
			$.tuple_exp,
			$.list_exp,
			$.vector_exp,
			$.let_exp,
		),

		access_exp: $ => seq(
			optional('op'),
			$._full_ident,
			repeat1(seq('.', $._full_ident)),
		),

		constant_exp: $ => $._constant,

		selector_exp: $ => seq('#', $.selector),

		rec_exp: $ => seq('{', $._elabel, repeat(seq(',', $._elabel)), '}'),

		_elabel: $ => seq($.selector, '=', $._exp),

		rec_unit_exp: $ => seq('{', '}'),

		tuple_unit_exp: $ => seq('(', ')'),

		seq_exp: $ => seq('(', $._exp, repeat(seq(';', $._exp)), ')'),

		tuple_exp: $ => seq('(', $._exp, repeat1(seq(',', $._exp)), ')'),

		list_exp: $ => choice(
			seq('[', ']'),
			seq('[', $._exp, repeat(seq(',', $._exp)), ']'),
		),

		vector_exp: $ => choice(
			seq('#[', ']'),
			seq('#[', $._exp, repeat(seq(',', $._exp)), ']'),
		),

		let_exp: $ => seq(
			'let',
			repeat(choice($._ldec, ';', $.local_dec)),
			'in',
			$._exp, repeat(seq(';', $._exp)),
			'end',
		),

		local_dec: $ => seq(
			'local',
			repeat(choice($._ldec, ';', $.local_dec)),
			'in',
			repeat(choice($._ldec, ';', $.local_dec)),
			'end',
		),

		// Constants

		_constant: $ => choice(
			$.int_constant,
			$.word_constant,
			$.float_constant,
			// $.char_constant,
			// $.string_constant,
		),

		int_constant: $ => /~?\d+|~?0x[0-9A-Fa-f]+/,

		word_constant: $ => /0w\d+|0wx[0-9A-Fa-f]+/,

		float_constant: $ => /~?\d+\.\d+([Ee]~\d+)?/,

		// Types

		_ty: $ => choice(
			$.tuple_ty,
			$.arrow_ty,
			$._ty_,
		),

		tuple_ty: $ => seq($._ty_, repeat1(seq('*', $._ty_))),

		arrow_ty: $ => prec.right(seq($._ty, '->', $._ty)),

		_ty_: $ => choice(
			$.var_ty,
			$.rec_ty,
			$.mark_ty,
			seq('(', $._ty, ')'),

		),

		var_ty: $ => $.tyvar,

		rec_ty: $ => choice(
			seq('{', '}'),
			seq('{', $._tlabel, repeat(seq(',', $._tlabel)), '}')
		),

		_tlabel: $ => seq($.selector, ':', $._ty),

		mark_ty: $ => seq(
			optional(choice(
				$._ty_,
				seq('(', $._ty, repeat1(seq(',', $._ty)), ')'),
			)),
			$.con_ty,
		),

		con_ty: $ => seq(
			$._full_ident,
			repeat(seq('.', $._full_ident)),
		),

		// Utils

		_tyvar_seq: $ => choice(
			$.tyvar,
			seq('(', $.tyvar, repeat1(seq(',', $.tyvar)), ')'),
		),

		selector: $ => choice($._full_ident, /\d+/),

		tyvar: $ => /'[A-Za-z0-9_']+/,

		ident: $ => /[A-Za-z][A-Za-z0-9_']*/,

		symbolic: $ => /[!%&$+\-/<]|[!%&$#+\-/:<=>?@\\~`^|*]+/,

		_full_ident: $ => choice($.ident, $.symbolic),
	}
});
