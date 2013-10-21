%lex
DecimalDigit [0-9]
DecimalDigits [0-9]+
NonZeroDigit [1-9]
OctalDigit [0-7]
HexDigit [0-9a-fA-F]
IdentifierStart [$_a-zA-Z]|("\\"[u]{HexDigit}{4})
IdentifierPart {IdentifierStart}|[0-9]
Identifier {IdentifierStart}{IdentifierPart}*
ExponentIndicator [eE]
SignedInteger [+-]?[0-9]+
DecimalIntegerLiteral [0]|({NonZeroDigit}{DecimalDigits}*)
ExponentPart {ExponentIndicator}{SignedInteger}
OctalIntegerLiteral [0]{OctalDigit}+
HexIntegerLiteral [0][xX]{HexDigit}+
DecimalLiteral ({DecimalIntegerLiteral}\.{DecimalDigits}*{ExponentPart}?)|(\.{DecimalDigits}{ExponentPart}?)|({DecimalIntegerLiteral}{ExponentPart}?)
LineContinuation \\(\r\n|\r|\n)
OctalEscapeSequence (?:[1-7][0-7]{0,2}|[0-7]{2,3})
HexEscapeSequence [x]{HexDigit}{2}
UnicodeEscapeSequence [u]{HexDigit}{4}
SingleEscapeCharacter [\'\"\\bfnrtv]
NonEscapeCharacter [^\'\"\\bfnrtv0-9xu]
CharacterEscapeSequence {SingleEscapeCharacter}|{NonEscapeCharacter}
EscapeSequence {CharacterEscapeSequence}|{OctalEscapeSequence}|{HexEscapeSequence}|{UnicodeEscapeSequence}
DoubleStringCharacter ([^\"\\\n\r]+)|(\\{EscapeSequence})|{LineContinuation}
SingleStringCharacter ([^\'\\\n\r]+)|(\\{EscapeSequence})|{LineContinuation}
StringLiteral (\"{DoubleStringCharacter}*\")|(\'{SingleStringCharacter}*\')
RegularExpressionNonTerminator [^\n\r]
RegularExpressionBackslashSequence \\{RegularExpressionNonTerminator}
RegularExpressionClassChar [^\n\r\]\\]|{RegularExpressionBackslashSequence}
RegularExpressionClass \[{RegularExpressionClassChar}*\]
RegularExpressionFlags {IdentifierPart}*
RegularExpressionFirstChar ([^\n\r\*\\\/\[])|{RegularExpressionBackslashSequence}|{RegularExpressionClass}
RegularExpressionChar ([^\n\r\\\/\[])|{RegularExpressionBackslashSequence}|{RegularExpressionClass}
RegularExpressionBody {RegularExpressionFirstChar}{RegularExpressionChar}*
RegularExpressionLiteral {RegularExpressionBody}\/{RegularExpressionFlags}
Reserved "false" | "true" | ";" | "," | "=" | "{" | "}" | "(" | ")" | "[" | "]" | "." | "?" | ":" | "===" | "==" | "!==" | "!=" | "!" | "<<=" | "<<" | "<=" | "<" | ">>>=" | ">>>" | ">>=" | ">>" | ">=" | ">" | "+=" | "++" | "+" | "-=" | "--" | "-" | "*=" | "*" | "/=" | "/" | "%=" | "%" | "&&" | "&=" | "&" | " |  | " | " | =" | " | " | "^=" | "^" | "~"
%%
\s+		/* skipe whitespaces */
"->"							   return '->';
";"                                return ";";
","                                return ",";
"="                                return "=";
"http"\:"//"[a-zA-Z0-9\-\.]+(\.[a-zA-Z]{2,3})?[\:\%\?\-\/\w]* return 'URL';
{Reserved} 						   return "RESERVED";
{Identifier}                       return "IDENTIFIER";
{DecimalLiteral}                   return "NUMERIC_LITERAL";
{HexIntegerLiteral}                return "NUMERIC_LITERAL";
{OctalIntegerLiteral}              return "NUMERIC_LITERAL";
{StringLiteral}					   return "STRING_LITERAL";
<<EOF>>                            return "EOF";

/lex

%%

expressions 
	: e EOF
		{return $1;}
	| decl EOF
		{return $1;}
;

VAR_LITERAL
	: NUMERIC_LITERAL,
	| STRING_LITERAL
;

decl
	: IDENTIFIER '=' VAR_LITERAL ',' decl
		{$$ = ['var', [$1, $3, $5]];}
	| IDENTIFIER '=' VAR_LITERAL ';' e
		{$$ = ['var', [$1, $3, $5]];}
;


JS_CODE
	: RESERVED,
	| VAR_LITERAL
;

JS_CODE_LIST
	: JS_CODE JS_CODE_LIST 
		{$$ = $1.concat($2);}
	| 
		{$$ = [];}
;

e
	: '(' e ')'
		{$$ = $2;}
	| JS_CODE_LIST
		{$$ = ['code', $1];}
	| '->' e
		{$$ = ['->', [Number.POSITIVE_INFINITY, $2]];}
	| '->' NUMBER e
		{$$ = ['->', [Number($2), $3]];}
;

%% /*grammar*/
