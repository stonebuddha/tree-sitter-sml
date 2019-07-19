const INT = token(/~?\d+|~?0x[0-9A-Fa-f]+/);
const WORD = token(/0w\d+|0wx[0-9A-Fa-f]+/);
const FLOAT = token(/~?\d+\.\d+([Ee]~?\d+)?/);

module.exports = grammar({
	name: 'standard_ml',

	extras: $ => [
		/\s/,
		$.comment,
	],

	word: $ => $.ident,

	externals: $ => [
		$.comment,
		$.string,
		$.character,
	],

	rules: {
		source_file: $ => seq(
			choice($._exp, repeat($._sdec)),
			repeat(
				seq(
					';',
					choice($._exp, repeat($._sdec)),
				),
			),
		),

		// Top-level declarations

		_sdec: $ => choice(
			$.structure_dec,
			$.signature_dec,
			$.funsig_dec,
			$.functor_dec,
			$.local_dec,
			$._ldec,
		),

		// Structures

		structure_dec: $ => seq(
			'structure',
			$.strb,
			repeat(seq('and', $.strb)),
		),

		strb: $ => seq(
			$.ident,
			optional($._sigconstraint_op),
			'=',
			$._str,
		),

		_sigconstraint_op: $ => choice(
			$.transparent_sigconstraint_op,
			$.opaque_sigconstraint_op,
		),

		transparent_sigconstraint_op: $ => seq(':', $._sign),

		opaque_sigconstraint_op: $ => seq(':>', $._sign),

		_str: $ => choice(
			$.var_struct,
			$.base_struct,
			$.app_struct,
			$.let_struct,
			$.constraint_struct,
		),

		var_struct: $ => $.qident,

		base_struct: $ => seq(
			'struct',
			repeat(choice(';', $._strdec)),
			'end',
		),

		_strdec: $ => choice(
			$.structure_dec_strdec,
			$.functor_dec_strdec,
			$.local_dec_strdec,
			$._ldec,
		),

		structure_dec_strdec: $ => seq(
			'structure',
			$.strb,
			repeat(seq('and', $.strb)),
		),

		functor_dec_strdec: $ => seq(
			'functor',
			$.fctb,
			repeat(seq('and', $.fctb)),
		),

		local_dec_strdec: $ => seq(
			'local',
			repeat(choice(';', $._strdec)),
			'in',
			repeat(choice(';', $._strdec)),
			'end',
		),

		app_struct: $ => seq(
			$.qident,
			repeat1($.arg_fct),
		),

		let_struct: $ => seq(
			'let',
			repeat(choice(';', $._strdec)),
			'in',
			$._str,
			'end',
		),

		constraint_struct: $ => seq($._str, choice(':', ':>'), $._sign),

		// Signatures

		signature_dec: $ => seq(
			'signature',
			$.sigb,
			repeat(seq('and', $.sigb)),
		),

		sigb: $ => seq($.ident, '=', $._sign),

		_sign: $ => choice(
			$.var_sign,
			$.base_sign,
			$.aug_sign,
		),

		var_sign: $ => $.ident,

		base_sign: $ => seq('sig', repeat(choice(';', $._spec)), 'end'),

		aug_sign: $ => prec.right(seq($._sign, 'where', $._whspec, repeat(seq('and', $._whspec)))),

		_spec: $ => choice(
			$.str_spec,
			$.functor_spec,
			$.datatype_repl_spec,
			$.datatype_spec,
			$.type_spec,
			$.eqtype_spec,
			$.val_spec,
			$.exception_spec,
			$.sharing_spec,
			$.include_spec,
		),

		str_spec: $ => seq(
			'structure',
			$.strspec,
			repeat(seq('and', $.strspec)),
		),

		strspec: $ => seq(
			$.ident,
			':',
			$._sign,
			optional(seq('=', $.qident)),
		),

		functor_spec: $ => seq(
			'functor',
			$.fctspec,
			repeat(seq('and', $.fctspec)),
		),

		fctspec: $ => seq($.ident, $._fsig),

		datatype_repl_spec: $ => seq(
			'datatype',
			$.dtrepl,
		),

		dtrepl: $ => seq($._full_ident, '=', 'datatype', $.con_ty),

		datatype_spec: $ => seq(
			'datatype',
			$.db,
			repeat(seq('and', $.db)),
			optional(seq('withtype', $.tb, repeat(seq('and', $.tb)))),
		),

		type_spec: $ => seq(
			'type',
			$.tyspec,
			repeat(seq('and', $.tyspec)),
		),

		tyspec: $ => seq(
			optional($.tyvar_seq),
			$._full_ident,
			optional(seq('=', $._ty)),
		),

		eqtype_spec: $ => seq(
			'eqtype',
			$.tyspec,
			repeat(seq('and', $.tyspec)),
		),

		val_spec: $ => seq(
			'val',
			$.valspec,
			repeat(seq('and', $.valspec)),
		),

		valspec: $ => seq(
			optional('op'),
			$._full_ident,
			':',
			$._ty
		),

		exception_spec: $ => seq(
			'exception',
			$.exnspec,
			repeat(seq('and', $.exnspec)),
		),

		exnspec: $ => seq($._full_ident, optional(seq('of', $._ty))),

		sharing_spec: $ => seq(
			'sharing',
			$.sharespec,
			repeat(seq('and', $.sharespec)),
		),

		sharespec: $ => seq(optional('type'), $.qident, repeat1(seq('=', $.qident))),

		include_spec: $ => seq(
			'include',
			choice(
				$._sign,
				seq($.ident, repeat1($.ident)),
			),
		),

		_whspec: $ => choice(
			$.type_whspec,
			$.struct_whsepc,
		),

		type_whspec: $ => seq('type', optional($.tyvar_seq), $.qident, '=', $._ty),

		struct_whsepc: $ => seq($.qident, '=', $.qident),

		// Funsigs

		funsig_dec: $ => seq(
			'funsig',
			$.fsigb,
			repeat(seq('and', $.fsigb)),
		),

		fsigb: $ => seq($.ident, repeat1($.fparam), '=', $._sign),

		_fsig: $ => choice(
			$.var_fsig,
			$.base_fsig,
		),

		var_fsig: $ => seq(':', $.ident),

		base_fsig: $ => seq(repeat1($.fparam), ':', $._sign),

		// Functors

		functor_dec: $ => seq(
			'functor',
			$.fctb,
			repeat(seq('and', $.fctb)),
		),

		fctb: $ => choice(
			seq($.ident, repeat1($.fparam), optional($._sigconstraint_op), '=', $._str),
			seq($.ident, optional($._fsigconstraint_op), '=', $._fct_exp),
		),

		fparam: $ => choice(
			seq('(', $.ident, ':', $._sign, ')'),
			seq('(', repeat(choice(';', $._spec)), ')'),
		),

		_fsigconstraint_op: $ => choice(
			$.transparent_fsigconstraint_op,
			$.opaque_fsigconstraint_op,
		),

		transparent_fsigconstraint_op: $ => seq(':', $.ident),

		opaque_fsigconstraint_op: $ => seq(':>', $.ident),

		_fct_exp: $ => choice(
			$.var_fct_exp,
			$.app_fct_exp,
			$.let_fct_exp,
		),

		var_fct_exp: $ => $.qident,

		app_fct_exp: $ => seq($.qident, repeat1($.arg_fct)),

		arg_fct: $ => choice(
			seq('(', repeat(choice(';', $._strdec)), ')'),
			seq('(', $._str, ')'),
		),

		let_fct_exp: $ => seq(
			'let',
			repeat(choice(';', $._strdec)),
			'in',
			$._fct_exp,
			'end',
		),

		// Misc

		local_dec: $ => seq(
			'local',
			repeat(choice(';', $._sdec)),
			'in',
			repeat(choice(';', $._sdec)),
			'end',
		),

		_ldec: $ => choice(
			$.val_ldec,
			$.fun_ldec,
			$.type_ldec,
			$.datatype_repl_ldec,
			$.datatype_ldec,
			$.abstype_ldec,
			$.exception_ldec,
			$.open_ldec,
			$.fixity_ldec,
			$.overload_ldec,
		),

		// Value declarations

		val_ldec: $ => seq(
			'val',
			optional($.tyvar_seq),
			optional('rec'),
			$.vb,
			repeat(seq('and', $.vb)),
		),

		vb: $ => seq(
			$._pat,
			'=',
			$._exp,
		),

		// Function declarations

		fun_ldec: $ => seq(
			'fun',
			optional($.tyvar_seq),
			$.fb,
			repeat(seq('and', $.fb)),
		),

		fb: $ => seq($.clause, repeat(seq('|', $.clause))),

		clause: $ => seq(
			repeat1($._apat),
			optional($.constraint),
			'=',
			$._exp
		),

		constraint: $ => seq(':', $._ty),

		// Type declarations

		type_ldec: $ => seq(
			'type',
			$.tb,
			repeat(seq('and', $.tb)),
		),

		tb: $ => seq(
			optional($.tyvar_seq),
			$._full_ident,
			'=',
			$._ty,
		),

		// Datatype declarations

		datatype_repl_ldec: $ => seq(
			'datatype',
			$.dtrepl,
		),

		datatype_ldec: $ => seq(
			'datatype',
			$.db,
			repeat(seq('and', $.db)),
			optional(
				seq(
					'withtype',
					$.tb,
					repeat(seq('and', $.tb)),
				),
			),
		),

		db: $ =>	seq(
			optional($.tyvar_seq),
			$._full_ident,
			'=',
			$.constr,
			repeat(seq('|', $.constr)),
		),

		constr: $ => seq(
			optional('op'),
			$._full_ident,
			optional(seq('of', $._ty)),
		),

		// Abstype declarations

		abstype_ldec: $ => seq(
			'abstype',
			$.db,
			repeat(seq('and', $.db)),
			optional(seq('withtype', $.tb, repeat(seq('and', $.tb)))),
			'with',
			repeat(choice(';', $._ldec, $.local_dec_let)),
			'end',
		),

		// Exception declarations

		exception_ldec: $ => seq(
			'exception',
			$.eb,
			repeat(seq('and', $.eb)),
		),

		eb: $ => seq(
			optional('op'),
			$._full_ident,
			optional(choice($.exn_gen, $.exn_def)),
		),

		exn_gen: $ => seq('of', $._ty),

		exn_def: $ => seq('=', $.qident),

		// Misc declarations

		open_ldec: $ => seq(
			'open',
			repeat1($.qident),
		),

		fixity_ldec: $ => seq(
			choice(seq(choice('infix', 'infixr'), optional($.int_constant)), 'nonfix'),
			repeat1($._full_ident),
		),

		overload_ldec: $ => seq(
			'overload',
			$._full_ident,
			':',
			$._ty,
			'as',
			$._exp,
			repeat(seq('and', $._exp)),
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
			$._apat_,
			$.paren_pat,
			$.var_pat,
			$.tuple_unit_pat,
			$.tuple_pat,
			$.or_pat,
		),

		paren_pat: $ => seq('(', $._pat, ')'),

		var_pat: $ => $._full_ident,

		tuple_unit_pat: $ => seq('(', ')'),

		tuple_pat: $ => seq('(', $._pat, repeat1(seq(',', $._pat)), ')'),

		or_pat: $ => seq('(', $._pat, repeat1(seq('|', $._pat)), ')'),

		_apat_: $ => choice(
			$.op_pat,
			$.access_pat,
			$.constant_pat,
			$.wild_pat,
			$.list_pat,
			$.vector_pat,
			$.rec_unit_pat,
			$.rec_pat,
		),

		op_pat: $ => seq('op', $._full_ident),

		access_pat: $ => seq(
			optional('op'),
			$.ident,
			'.',
			$.qident,
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

		rec_unit_pat: $ => seq('{', '}'),

		rec_pat: $ => seq('{', $.plabels, '}'),

		plabels: $ => choice(
			seq($.plabel, repeat(seq(',', $.plabel)), optional(seq(',', '...'))),
			'...',
		),

		plabel: $ => choice(
			seq($.selector, '=', $._pat),
			seq(
				$._full_ident,
				optional(seq(':', $._ty)),
				optional(seq('as', $._pat)),
			),
		),

		// Matches

		match: $ => prec.right(seq($.rule, repeat(seq('|', $.rule)))),

		rule: $ => prec.right(seq($._pat, '=>', $._exp)),

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

		handle_exp: $ => prec.right(seq($._exp, 'handle', $.match)),

		orelse_exp: $ => prec.right(seq($._exp, 'orelse', $._exp)),

		andalso_exp: $ => prec.right(seq($._exp, 'andalso', $._exp)),

		constraint_exp: $ => seq($._exp, ':', $._ty),

		app_exp: $ => repeat1(choice($._aexp, $.var_exp)),

		fn_exp: $ => seq('fn', $.match),

		case_exp: $ => seq('case', $._exp, 'of', $.match),

		while_exp: $ => prec.left(seq('while', $._exp, 'do', $._exp)),

		if_exp: $ => prec.left(seq('if', $._exp, 'then', $._exp, 'else', $._exp)),

		raise_exp: $ => prec.left(seq('raise', $._exp)),

		var_exp: $ => $._full_ident,

		_aexp: $ => choice(
			$.op_exp,
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

		op_exp: $ =>	seq('op', $._full_ident),

		access_exp: $ => seq(
			optional('op'),
			$.ident,
			'.',
			$.qident,
		),

		constant_exp: $ => $._constant,

		selector_exp: $ => seq('#', $.selector),

		rec_exp: $ => seq('{', $.elabel, repeat(seq(',', $.elabel)), '}'),

		elabel: $ => seq($.selector, '=', $._exp),

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
			repeat(choice($._ldec, ';', $.local_dec_let)),
			'in',
			$._exp, repeat(seq(';', $._exp)),
			'end',
		),

		local_dec_let: $ => seq(
			'local',
			repeat(choice($._ldec, ';', $.local_dec_let)),
			'in',
			repeat(choice($._ldec, ';', $.local_dec_let)),
			'end',
		),

		// Constants

		_constant: $ => choice(
			$.int_constant,
			$.word_constant,
			$.float_constant,
			$.char_constant,
			$.string_constant,
		),

		int_constant: $ => INT,

		word_constant: $ => WORD,

		float_constant: $ => FLOAT,

		char_constant: $ => $.character,

		string_constant: $ => $.string,

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
			$.paren_ty,
		),

		var_ty: $ => $.tyvar,

		rec_ty: $ => choice(
			seq('{', '}'),
			seq('{', $.tlabel, repeat(seq(',', $.tlabel)), '}')
		),

		tlabel: $ => seq($.selector, ':', $._ty),

		mark_ty: $ => seq(
			optional(choice(
				$._ty_,
				seq('(', $._ty, repeat1(seq(',', $._ty)), ')'),
			)),
			$.con_ty,
		),

		con_ty: $ => $.qident,

		paren_ty: $ => seq('(', $._ty, ')'),

		// Utils

		tyvar_seq: $ => choice(
			$.tyvar,
			seq('(', $.tyvar, repeat1(seq(',', $.tyvar)), ')'),
		),

		selector: $ => choice($._full_ident, /\d+/),

		tyvar: $ => /'[A-Za-z0-9_']+/,

		ident: $ => /[A-Za-z][A-Za-z0-9_']*/,

		symbolic: $ => choice(
			/[!%&$#+\-/:<=>?@\\~`^|*][!%&$#+\-/:<=>?@\\~`^|*][!%&$#+\-/:<=>?@\\~`^|*]+/,
			/[!%&$#+/<>?@\\~`^|*][!%&$#+\-/:<=>?@\\~`^|*]/,
			/[\-:=][!%&$#+\-/:<=?@\\~`^|*]/,
			/[!%&$+\-/<=>?@\\~`^*]/,
		),

		_full_ident: $ => choice($.ident, $.symbolic),

		qident: $ => seq(repeat(seq($.ident, '.')), $._full_ident),
	},
});
