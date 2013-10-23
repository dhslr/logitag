%lex

%%
\s+		/* skipe whitespaces */
[0-9]+	return 'NUMBER';
"http"\:"//"[a-zA-Z0-9\-\.]+(\.[a-zA-Z]{2,3})?[\:\%\?\-\/\w]* return 'URL';
"&&"		return '&&';
"||"		return '||';
"!"		return '!';
"="		return '=';
","		return ',';
";"		return ';';
\([a-zA-Z][\&\|\!\s\>\<\w\{\}\.\:\(\)]*\) return 'IQEXPRW';
[a-zA-Z][\&\|\!\>\<\w\{\}\.\:]* return 'IQEXPR';
[A-Za-z]\w* return 'TAG';
"("		return '(';
")"		return ')';
"->"		return '->';
<<EOF>>	return 'EOF';
/lex

/* associations and precedence */
%left '&&'
%left '||'
%right '!'
%right '->'
%token IQEXPR IQEXPRW NUMBER TAG

%% /* language grammar */
expressions 
	: e EOF
		{return $1;}
	| decl EOF
		{return $1;}
	;
decl
	: IQEXPR '=' URL ',' decl
		{$$ = ['url', [$1, $3, $5]];}
	| IQEXPR '=' URL ';' e
		{$$ = ['url', [$1, $3, $5]];}
	;
e
	: e '&&' e
		{$$ = ['&&', [$1, $3]];}
	| e '||' e
		{$$ = ['||', [$1, $3]];}
	| '(' e ')'
		{$$ = $2;}
	| '!' e
		{$$ = ['!', [$2]];}
	| '->' e
		{$$ = ['->', [Number.POSITIVE_INFINITY, $2]];}
	| '->' NUMBER e
		{$$ = ['->', [Number($2), $3]];}
	| IQEXPR
		{$$ = ['iqexpr', String($1)];}
	| IQEXPRW
		{$$ = ['iqexpr', String($1)];}
;
