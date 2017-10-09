//-------------------------------------------------------------------------------------------------------
// Copyright (C) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.txt file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------
// M(TagName)
//     ClassName == TagName##Inst
// MTemplate(TagName, TemplateDeclaration, GenericClassName, SpecializedClassName)

// TODO (doilij) reorg
M(Nop) // Opcode byte 0x00 is a NOP (allows for NOP-sleds for alignment if necessary)
// 0x00
M(Fail) // REMOVE (doilij): tested
M(Succ) // REMOVE (doilij): tested
M(Jump) // REMOVE (doilij): tested
M(JumpIfNotChar) // TODO (doilij): not tested
M(MatchCharOrJump) // TODO (doilij): not tested
M(JumpIfNotSet) // TODO (doilij): not tested
M(MatchSetOrJump) // TODO (doilij): not tested
M(Switch10) // TODO (doilij): not tested
// 0x08
M(Switch20) // TODO (doilij): not tested
M(SwitchAndConsume10) // REMOVE (doilij): tested
M(SwitchAndConsume20) // REMOVE (doilij): tested
M(BOITest) // TODO (doilij): not tested
M(EOITest) // TODO (doilij): not tested
M(BOLTest) // TODO (doilij): not tested
M(EOLTest) // TODO (doilij): not tested
M(WordBoundaryTest)
// 0x10
M(MatchChar) // REMOVE (doilij): tested
M(MatchChar2)
M(MatchChar3)
M(MatchChar4)
MTemplate(MatchSet, template<bool IsNegation>, MatchSetInst, MatchSetInst<false>)
MTemplate(MatchNegatedSet, template<bool IsNegation>, MatchSetInst, MatchSetInst<true>)
M(MatchLiteral) // REMOVE (doilij): tested
M(MatchLiteralEquiv)
// 0x18
M(MatchTrie)
M(OptMatchChar)
M(OptMatchSet)
M(SyncToCharAndContinue)
M(SyncToChar2SetAndContinue)
MTemplate(SyncToSetAndContinue, template<bool IsNegation>, SyncToSetAndContinueInst, SyncToSetAndContinueInst<false>)
MTemplate(SyncToNegatedSetAndContinue, template<bool IsNegation>, SyncToSetAndContinueInst, SyncToSetAndContinueInst<true>)
M(SyncToChar2LiteralAndContinue)
// 0x20
M(SyncToLiteralAndContinue)
M(SyncToLinearLiteralAndContinue)
M(SyncToLiteralEquivAndContinue)
M(SyncToLiteralEquivTrivialLastPatCharAndContinue)
M(SyncToCharAndConsume)
M(SyncToChar2SetAndConsume)
MTemplate(SyncToSetAndConsume, template<bool IsNegation>, SyncToSetAndConsumeInst, SyncToSetAndConsumeInst<false>) // REMOVE (doilij): tested
MTemplate(SyncToNegatedSetAndConsume, template<bool IsNegation>, SyncToSetAndConsumeInst, SyncToSetAndConsumeInst<true>)
// 0x28
M(SyncToChar2LiteralAndConsume)
M(SyncToLiteralAndConsume)
M(SyncToLinearLiteralAndConsume)
M(SyncToLiteralEquivAndConsume)
M(SyncToLiteralEquivTrivialLastPatCharAndConsume)
M(SyncToCharAndBackup)
MTemplate(SyncToSetAndBackup, template<bool IsNegation>, SyncToSetAndBackupInst, SyncToSetAndBackupInst<false>) // REMOVE (doilij): tested
MTemplate(SyncToNegatedSetAndBackup, template<bool IsNegation>, SyncToSetAndBackupInst, SyncToSetAndBackupInst<true>)
// 0x30
M(SyncToChar2LiteralAndBackup)
M(SyncToLiteralAndBackup)
M(SyncToLinearLiteralAndBackup)
M(SyncToLiteralEquivAndBackup)
M(SyncToLiteralEquivTrivialLastPatCharAndBackup)
M(SyncToLiteralsAndBackup) // REMOVE (doilij): tested
M(MatchGroup)
M(BeginDefineGroup)
// 0x38
M(EndDefineGroup)
M(DefineGroupFixed) // REMOVE (doilij): tested
M(BeginLoop)
M(RepeatLoop)
M(BeginLoopIfChar)
M(BeginLoopIfSet)
M(RepeatLoopIfChar)
M(RepeatLoopIfSet)
// 0x40
M(BeginLoopFixed)
M(RepeatLoopFixed)
M(LoopSet)
M(LoopSetWithFollowFirst)
M(BeginLoopFixedGroupLastIteration)
M(RepeatLoopFixedGroupLastIteration)
M(BeginGreedyLoopNoBacktrack)
M(RepeatGreedyLoopNoBacktrack)
// 0x48
MTemplate(ChompCharStar, template<ChompMode Mode>, ChompCharInst, ChompCharInst<ChompMode::Star>)
MTemplate(ChompCharPlus, template<ChompMode Mode>, ChompCharInst, ChompCharInst<ChompMode::Plus>)
MTemplate(ChompSetStar, template<ChompMode Mode>, ChompSetInst, ChompSetInst<ChompMode::Star>)
MTemplate(ChompSetPlus, template<ChompMode Mode>, ChompSetInst, ChompSetInst<ChompMode::Plus>) // REMOVE (doilij): tested
MTemplate(ChompCharGroupStar, template<ChompMode Mode>, ChompCharGroupInst, ChompCharGroupInst<ChompMode::Star>)
MTemplate(ChompCharGroupPlus, template<ChompMode Mode>, ChompCharGroupInst, ChompCharGroupInst<ChompMode::Plus>)
MTemplate(ChompSetGroupStar, template<ChompMode Mode>, ChompSetGroupInst, ChompSetGroupInst<ChompMode::Star>)
MTemplate(ChompSetGroupPlus, template<ChompMode Mode>, ChompSetGroupInst, ChompSetGroupInst<ChompMode::Plus>)
// 0x50
M(ChompCharBounded)
M(ChompSetBounded)
M(ChompSetBoundedGroupLastChar)
M(Try)
M(TryIfChar)
M(TryMatchChar)
M(TryIfSet)
M(TryMatchSet) // REMOVE (doilij): tested
// 0x58
M(BeginAssertion)
M(EndAssertion)
