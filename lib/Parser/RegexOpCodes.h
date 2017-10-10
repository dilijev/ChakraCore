//-------------------------------------------------------------------------------------------------------
// Copyright (C) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.txt file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------
// M(TagName)
//     ClassName == TagName##Inst
// MTemplate(TagName, TemplateDeclaration, GenericClassName, SpecializedClassName)

// 0x00
M(Nop) // Opcode byte 0x00 is a NOP (allows for NOP-sleds for alignment if necessary)
M(Fail) // REMOVE (doilij): tested // DONE MACROS
M(Succ) // REMOVE (doilij): tested // DONE MACROS
M(Jump) // REMOVE (doilij): tested // DONE MACROS
M(JumpIfNotChar) // TODO (doilij): not tested // DONE MACROS
M(MatchCharOrJump) // TODO (doilij): not tested // DONE MACROS
M(JumpIfNotSet) // TODO (doilij): not tested // DONE MACROS
M(MatchSetOrJump) // TODO (doilij): not tested // DONE MACROS
// 0x08
M(Switch10) // TODO (doilij): not tested // DONE MACROS
M(Switch20) // TODO (doilij): not tested // DONE MACROS
M(SwitchAndConsume10) // REMOVE (doilij): tested // DONE MACROS
M(SwitchAndConsume20) // REMOVE (doilij): tested // DONE MACROS
M(BOITest) // TODO (doilij): not tested // DONE MACROS
M(EOITest) // TODO (doilij): not tested // DONE MACROS
M(BOLTest) // TODO (doilij): not tested // DONE MACROS
M(EOLTest) // TODO (doilij): not tested // DONE MACROS
// 0x10
M(WordBoundaryTest) // TODO (doilij): not tested // DONE MACROS
M(MatchChar) // REMOVE (doilij): tested // DONE MACROS
M(MatchChar2) // TODO (doilij): not tested // DONE MACROS
M(MatchChar3) // TODO (doilij): not tested // DONE MACROS
M(MatchChar4) // TODO (doilij): not tested // DONE MACROS
MTemplate(MatchSet, template<bool IsNegation>, MatchSetInst, MatchSetInst<false>) // TODO (doilij): not tested // DONE MACROS
MTemplate(MatchNegatedSet, template<bool IsNegation>, MatchSetInst, MatchSetInst<true>) // TODO (doilij): not tested // DONE MACROS
M(MatchLiteral) // REMOVE (doilij): tested // DONE MACROS
// 0x18
M(MatchLiteralEquiv) // REMOVE (doilij): tested // DONE MACROS
M(MatchTrie) // TODO (doilij): not tested // DONE MACROS
M(OptMatchChar) // TODO (doilij): not tested // DONE MACROS
M(OptMatchSet) // TODO (doilij): not tested // DONE MACROS
M(SyncToCharAndContinue) // TODO (doilij): not tested // DONE MACROS
M(SyncToChar2SetAndContinue) // TODO (doilij): not tested // DONE MACROS
MTemplate(SyncToSetAndContinue, template<bool IsNegation>, SyncToSetAndContinueInst, SyncToSetAndContinueInst<false>) // TODO (doilij): not tested // DONE MACROS
MTemplate(SyncToNegatedSetAndContinue, template<bool IsNegation>, SyncToSetAndContinueInst, SyncToSetAndContinueInst<true>) // TODO (doilij): not tested // DONE MACROS
// 0x20
M(SyncToChar2LiteralAndContinue) // SyncToLiteralAndContinueInstT<Char2LiteralScannerMixin> // TODO (doilij): not tested // DONE MACROS
M(SyncToLiteralAndContinue) // SyncToLiteralAndContinueInstT<ScannerMixin> // TODO (doilij): not tested // DONE MACROS
M(SyncToLinearLiteralAndContinue) // SyncToLiteralAndContinueInstT<ScannerMixin_WithLinearCharMap> // TODO (doilij): not tested // DONE MACROS
M(SyncToLiteralEquivAndContinue) // SyncToLiteralAndContinueInstT<EquivScannerMixin> // TODO (doilij): not tested // DONE MACROS
M(SyncToLiteralEquivTrivialLastPatCharAndContinue) // SyncToLiteralAndContinueInstT<EquivTrivialLastPatCharScannerMixin> // TODO (doilij): not tested // DONE MACROS
M(SyncToCharAndConsume) // TODO (doilij): not tested // DONE MACROS
M(SyncToChar2SetAndConsume) // TODO (doilij): not tested // DONE MACROS
MTemplate(SyncToSetAndConsume, template<bool IsNegation>, SyncToSetAndConsumeInst, SyncToSetAndConsumeInst<false>) // REMOVE (doilij): tested // DONE MACROS
// 0x28
MTemplate(SyncToNegatedSetAndConsume, template<bool IsNegation>, SyncToSetAndConsumeInst, SyncToSetAndConsumeInst<true>) // TODO (doilij): not tested // DONE MACROS
M(SyncToChar2LiteralAndConsume) // SyncToLiteralAndConsumeInstT<Char2LiteralScannerMixin> // TODO (doilij): not tested // DONE MACROS
M(SyncToLiteralAndConsume) // SyncToLiteralAndConsumeInstT<ScannerMixin> // TODO (doilij): not tested // DONE MACROS
M(SyncToLinearLiteralAndConsume) // SyncToLiteralAndConsumeInstT<ScannerMixin_WithLinearCharMap> // TODO (doilij): not tested // DONE MACROS
M(SyncToLiteralEquivAndConsume) // SyncToLiteralAndConsumeInstT<EquivScannerMixin> // TODO (doilij): not tested // DONE MACROS
M(SyncToLiteralEquivTrivialLastPatCharAndConsume) // SyncToLiteralAndConsumeInstT<EquivTrivialLastPatCharScannerMixin> // TODO (doilij): not tested // DONE MACROS
M(SyncToCharAndBackup) // REMOVE (doilij): tested // DONE MACROS
// REVIEW (doilij): why not have a SyncToChar2SetAndBackup ?
MTemplate(SyncToSetAndBackup, template<bool IsNegation>, SyncToSetAndBackupInst, SyncToSetAndBackupInst<false>) // REMOVE (doilij): tested // DONE MACROS
// 0x30
MTemplate(SyncToNegatedSetAndBackup, template<bool IsNegation>, SyncToSetAndBackupInst, SyncToSetAndBackupInst<true>) // TODO (doilij): not tested // DONE MACROS
M(SyncToChar2LiteralAndBackup) // SyncToLiteralAndBackupInstT<Char2LiteralScannerMixin> // TODO (doilij): not tested
M(SyncToLiteralAndBackup) // SyncToLiteralAndBackupInstT<ScannerMixin> // TODO (doilij): not tested
M(SyncToLinearLiteralAndBackup) // SyncToLiteralAndBackupInstT<ScannerMixin_WithLinearCharMap> // TODO (doilij): not tested
M(SyncToLiteralEquivAndBackup) // SyncToLiteralAndBackupInstT<EquivScannerMixin> // TODO (doilij): not tested
M(SyncToLiteralEquivTrivialLastPatCharAndBackup) // SyncToLiteralAndBackupInstT<EquivTrivialLastPatCharScannerMixin> // TODO (doilij): not tested
M(SyncToLiteralsAndBackup) // REMOVE (doilij): tested
M(MatchGroup) // TODO (doilij): not tested
// 0x38
M(BeginDefineGroup) // TODO (doilij): not tested
M(EndDefineGroup) // TODO (doilij): not tested
M(DefineGroupFixed) // REMOVE (doilij): tested // DONE MACROS
M(BeginLoop) // REMOVE (doilij): tested // DONE MACROS
M(RepeatLoop) // TODO (doilij): not tested // DONE MACROS
M(BeginLoopIfChar) // TODO (doilij): not tested // DONE MACROS
M(BeginLoopIfSet) // TODO (doilij): not tested // DONE MACROS
M(RepeatLoopIfChar) // TODO (doilij): not tested // DONE MACROS
// 0x40
M(RepeatLoopIfSet) // TODO (doilij): not tested // DONE MACROS
M(BeginLoopFixed) // TODO (doilij): not tested // DONE MACROS
M(RepeatLoopFixed) // TODO (doilij): not tested // DONE MACROS
M(LoopSet) // TODO (doilij): not tested // DONE MACROS
M(LoopSetWithFollowFirst) // TODO (doilij): not tested // DONE MACROS
M(BeginLoopFixedGroupLastIteration) // TODO (doilij): not tested // DONE MACROS
M(RepeatLoopFixedGroupLastIteration) // TODO (doilij): not tested // DONE MACROS
M(BeginGreedyLoopNoBacktrack) // TODO (doilij): not tested // DONE MACROS
// 0x48
M(RepeatGreedyLoopNoBacktrack) // TODO (doilij): not tested // DONE MACROS
MTemplate(ChompCharStar, template<ChompMode Mode>, ChompCharInst, ChompCharInst<ChompMode::Star>) // TODO (doilij): not tested // DONE MACROS
MTemplate(ChompCharPlus, template<ChompMode Mode>, ChompCharInst, ChompCharInst<ChompMode::Plus>) // REMOVE (doilij): tested // DONE MACROS
MTemplate(ChompSetStar, template<ChompMode Mode>, ChompSetInst, ChompSetInst<ChompMode::Star>) // TODO (doilij): not tested // DONE MACROS
MTemplate(ChompSetPlus, template<ChompMode Mode>, ChompSetInst, ChompSetInst<ChompMode::Plus>) // REMOVE (doilij): tested // DONE MACROS
MTemplate(ChompCharGroupStar, template<ChompMode Mode>, ChompCharGroupInst, ChompCharGroupInst<ChompMode::Star>) // TODO (doilij): not tested // DONE MACROS
MTemplate(ChompCharGroupPlus, template<ChompMode Mode>, ChompCharGroupInst, ChompCharGroupInst<ChompMode::Plus>) // TODO (doilij): not tested // DONE MACROS
MTemplate(ChompSetGroupStar, template<ChompMode Mode>, ChompSetGroupInst, ChompSetGroupInst<ChompMode::Star>) // TODO (doilij): not tested // DONE MACROS
// 0x50
MTemplate(ChompSetGroupPlus, template<ChompMode Mode>, ChompSetGroupInst, ChompSetGroupInst<ChompMode::Plus>) // TODO (doilij): not tested // DONE MACROS
M(ChompCharBounded) // TODO (doilij): not tested // DONE MACROS
M(ChompSetBounded) // TODO (doilij): not tested // DONE MACROS
M(ChompSetBoundedGroupLastChar) // TODO (doilij): not tested // DONE MACROS
M(Try) // TODO (doilij): not tested // DONE MACROS
M(TryIfChar) // TODO (doilij): not tested // DONE MACROS
M(TryMatchChar) // TODO (doilij): not tested // DONE MACROS
M(TryIfSet) // TODO (doilij): not tested // DONE MACROS
// 0x58
M(TryMatchSet) // REMOVE (doilij): tested // DONE MACROS
M(BeginAssertion) // TODO (doilij): not tested // DONE MACROS
M(EndAssertion) // TODO (doilij): not tested // DONE MACROS
