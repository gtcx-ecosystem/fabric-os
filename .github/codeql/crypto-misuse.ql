/**
 * @name GTCX Cryptographic Misuse Detection
 * @description Detects common cryptographic anti-patterns in JavaScript/TypeScript:
 *              hardcoded keys, insecure randomness, unverified JWTs, and deprecated crypto APIs.
 * @kind problem
 * @id gtcx/crypto-misuse
 * @problem.severity error
 * @security-severity 8.0
 * @precision medium
 * @tags security
 *       cryptography
 *       gtcx
 */

import javascript

// ---------------------------------------------------------------------------
// 1. Hardcoded cryptographic keys
//    Hex strings >= 32 chars assigned to variables whose name contains
//    "key", "secret", or "password".
// ---------------------------------------------------------------------------

class HardcodedCryptoKey extends DataFlow::Node {
  HardcodedCryptoKey() {
    exists(AssignExpr assign, StringLiteral lit |
      lit = assign.getRhs() and
      this = lit.flow() and
      lit.getValue().regexpMatch("(?i)[0-9a-f]{32,}") and
      assign.getLhs().(VarRef).getName().regexpMatch("(?i).*(key|secret|password).*")
    )
    or
    exists(VariableDeclarator decl, StringLiteral lit |
      lit = decl.getInit() and
      this = lit.flow() and
      lit.getValue().regexpMatch("(?i)[0-9a-f]{32,}") and
      decl.getBindingPattern().(VarDecl).getName().regexpMatch("(?i).*(key|secret|password).*")
    )
  }
}

from HardcodedCryptoKey node
select node,
  "Hardcoded cryptographic key detected. Move to environment variable or secret manager."

// ---------------------------------------------------------------------------
// 2. Insecure randomness: Math.random() instead of crypto.randomBytes /
//    crypto.getRandomValues
// ---------------------------------------------------------------------------

class InsecureMathRandom extends DataFlow::Node {
  InsecureMathRandom() {
    exists(MethodCallExpr call |
      call.getReceiver().(GlobalVarAccess).getName() = "Math" and
      call.getMethodName() = "random" and
      this = call.flow()
    )
  }
}

from InsecureMathRandom node
select node,
  "Math.random() is not cryptographically secure. Use crypto.randomBytes() or crypto.getRandomValues()."

// ---------------------------------------------------------------------------
// 3. Unverified JWT tokens: jwt.decode() without a corresponding jwt.verify()
//    in the same function / enclosing scope.
// ---------------------------------------------------------------------------

class JwtDecodeWithoutVerify extends MethodCallExpr {
  JwtDecodeWithoutVerify() {
    this.getMethodName() = "decode" and
    exists(DataFlow::moduleMember("jsonwebtoken", "decode").getACall() |
      this = any(DataFlow::CallNode c).asExpr()
    ) and
    not exists(MethodCallExpr verify |
      verify.getMethodName() = "verify" and
      verify.getEnclosingFunction() = this.getEnclosingFunction()
    )
  }
}

from JwtDecodeWithoutVerify call
select call,
  "jwt.decode() used without jwt.verify() in the same scope. Tokens must be verified before trusting claims."

// ---------------------------------------------------------------------------
// 4. Deprecated crypto functions: createCipher / createDecipher
//    (should use createCipheriv / createDecipheriv)
// ---------------------------------------------------------------------------

class DeprecatedCryptoFunction extends DataFlow::CallNode {
  DeprecatedCryptoFunction() {
    exists(string name |
      name = "createCipher" or name = "createDecipher" |
      this = DataFlow::moduleMember("crypto", name).getACall()
    )
  }
}

from DeprecatedCryptoFunction call
select call,
  "Deprecated crypto." + call.getCalleeName() +
    "() detected. Use " + call.getCalleeName() + "iv() with an explicit IV instead."
