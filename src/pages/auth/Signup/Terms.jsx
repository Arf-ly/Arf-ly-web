import React, { useState } from "react";
import "./Terms.css";

import grayCheckCircle from "../../../assets/terms/gray_check_circle.svg";
import pinkCheckCircle from "../../../assets/terms/pink_check_circle.svg";
import grayCheck from "../../../assets/terms/gray_check.svg";
import pinkCheck from "../../../assets/terms/pink_check.svg";
import nextIcon from "../../../assets/terms/next.svg";
import backbtn from "../../../assets/terms/backbtn.svg";

/** 약관 본문과 개별 동의 항목을 표시하고 필수 동의 여부를 확인한다. */
const Terms = ({ onComplete }) => {
  const [detailView, setDetailView] = useState(null);
  const [allAgreed, setAllAgreed] = useState(false);
  const [agreements, setAgreements] = useState({
    service: false,
    privacy: false,
    ai_ref: false,
    location: false,
    ai_collect: false,
    push: false,
    night: false,
  });

  const termsList = [
    {
      id: "service",
      title: "(필수) 서비스 이용 약관",
      content: `제1조 목적
이 약관은 Arfly 서비스 운영 팀(이하 “운영자”)가 운영하는 서비스(이하 “서비스”)의 이용과 관련하여, 운영자와 회원 사이의 권리·의무 및 책임사항, 서비스 이용절차 등 필요한 사항을 정하는 것을 목적으로 합니다.

제2조 약관의 공지 및 변경
운영자는 관련 법령을 위반하지 않는 범위에서 본 약관을 수정하거나 변경할 수 있습니다.
운영자가 약관을 변경하는 경우에는 변경 내용과 시행일을 명확히 표시하여, 시행일 전에 서비스 화면 또는 공지사항 등을 통해 안내합니다.
변경된 약관의 내용이 회원에게 중대한 영향을 미치는 경우, 운영자는 일반 공지 외에 전자우편이나 서비스 내 알림 등 적절한 방법으로 추가 안내할 수 있습니다.
회원은 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 회원탈퇴를 요청할 수 있습니다.
운영자가 변경 약관을 공지 또는 통지하면서 일정 기간 내 별도의 거부의사를 표시하지 않고 서비스를 계속 이용하는 경우 변경된 약관에 동의한 것으로 본다는 내용을 함께 안내한 때에는, 회원이 해당 기간 동안 명시적인 거부의사를 표시하지 아니한 경우 변경된 약관에 동의한 것으로 봅니다.
본 약관에 정하지 아니한 사항은 관련 법령, 개인정보처리방침 및 운영자가 별도로 정한 운영정책에 따릅니다.

제3조 용어의 정의
운영자는 관련 법령을 위반하지 않는 범위에서 본 약관을 수정하거나 변경할 수 있습니다.
운영자가 약관을 변경하는 경우에는 변경 내용과 시행일을 명확히 표시하여, 시행일 전에 서비스 화면 또는 공지사항 등을 통해 안내합니다.
변경된 약관의 내용이 회원에게 중대한 영향을 미치는 경우, 운영자는 일반 공지 외에 전자우편이나 서비스 내 알림 등 적절한 방법으로 추가 안내할 수 있습니다.
회원은 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 회원탈퇴를 요청할 수 있습니다.
운영자가 변경 약관을 공지 또는 통지하면서 일정 기간 내 별도의 거부의사를 표시하지 않고 서비스를 계속 이용하는 경우 변경된 약관에 동의한 것으로 본다는 내용을 함께 안내한 때에는, 회원이 해당 기간 동안 명시적인 거부의사를 표시하지 아니한 경우 변경된 약관에 동의한 것으로 봅니다.
본 약관에 정하지 아니한 사항은 관련 법령, 개인정보처리방침 및 운영자가 별도로 정한 운영정책에 따릅니다.

제4조 이용계약의 성립
서비스 이용계약은 서비스를 이용하려는 자가 약관에 동의하고 회원가입을 신청한 뒤, 운영자가 이를 승낙함으로써 성립합니다.
운영자는 통상적으로 가입 신청을 승낙하되, 운영상 또는 기술상 필요가 있는 경우 승낙을 유보하거나 제한할 수 있습니다.
회원가입 시 입력한 정보는 본인의 정확한 정보여야 하며, 타인의 정보를 도용하거나 허위 내용을 기재해서는 안 됩니다.

제5조 회원가입, 승낙 제한 및 탈퇴
회원가입은 신청자가 서비스에서 요구하는 정보를 입력하고 본 약관에 동의한 후, 가입 절차를 완료함으로써 신청됩니다.
회원은 서비스 이용을 위하여 운영자가 요구하는 범위 내에서 본인의 정보 및 반려동물 정보를 등록할 수 있으며, 등록한 정보는 정확하고 최신의 상태로 유지하여야 합니다.
운영자는 다음 각 호의 어느 하나에 해당하는 경우 가입신청을 승낙하지 않거나, 가입 후에도 이용계약을 해지할 수 있습니다.
타인의 정보를 무단으로 사용하거나 도용하여 신청한 경우
가입 신청 시 허위 사실을 기재하거나 필수 정보를 누락한 경우
법령 또는 본 약관에 위반되는 목적으로 서비스를 이용하고자 하는 경우
서비스 운영 또는 다른 회원의 정상적인 이용을 방해할 우려가 있다고 합리적으로 판단되는 경우
타인의 개인정보 또는 타인의 반려동물 정보를 권한 없이 등록하거나 업로드한 경우
그 밖에 운영자가 정한 가입 기준을 충족하지 못한 경우
운영자는 다음 각 호의 사유가 있는 경우 해당 사유가 해소될 때까지 가입 승낙을 보류할 수 있습니다.
시스템 설비, 서버 용량 또는 네트워크 여건이 충분하지 않은 경우
기술적 장애 또는 서비스 오류가 발생한 경우
기타 안정적인 서비스 제공이 어렵다고 판단되는 경우
회원은 언제든지 서비스에서 정한 절차에 따라 탈퇴를 신청할 수 있으며, 운영자는 관련 법령 및 내부 정책에 따라 이를 처리합니다.
회원이 탈퇴하더라도 관계 법령에 따라 일정 기간 보관이 필요한 정보는 해당 기간 동안 보관될 수 있습니다.
회원이 서비스에 게시하거나 등록한 게시물, 반려동물 프로필 정보, 사진 등은 서비스의 운영 방식이나 관련 법령에 따라 탈퇴와 동시에 즉시 삭제되지 않을 수 있습니다. 다만, 다른 이용자와 공유되지 않은 정보 또는 회원의 계정에만 연동된 정보는 운영정책 및 개인정보처리방침에 따라 처리됩니다.

제6조 개인정보의 보호 및 처리
운영자는 회원의 보호자 정보 및 회원 계정과 연결되는 반려동물 정보를 관련 법령 및 개인정보처리방침에 따라 처리합니다.
운영자는 회원 식별, 반려동물 프로필 관리, AI 기반 피부 상태 분석 서비스 제공, 분석 이력 관리, 고객 문의 대응 및 서비스 운영을 위해 필요한 범위에서 정보를 처리할 수 있습니다.
반려동물의 프로필 사진, 피부 사진 및 건강 관련 입력 정보는 서비스 기능 제공을 위해 처리될 수 있으며, 구체적인 수집 항목, 이용 목적, 보관기간은 개인정보처리방침 또는 별도 화면 안내에 따릅니다.
회원은 본인 또는 정당한 권한이 있는 반려동물의 정보만 등록하여야 하며, 제3자의 권리를 침해하는 정보가 포함되지 않도록 하여야 합니다.
회원은 자신의 보호자 정보에 대해 열람, 정정, 삭제 등을 요청할 수 정하며, 운영자는 관련 법령에 따라 이를 처리합니다.

제7조 커뮤니티 이용 규칙
사용자가 커뮤니티에 등록한 게시물(사진, 글 등)의 저작권은 사용자에게 있습니다. 단, 타인의 명예를 훼손하거나, 불법적인 내용을 포함하거나, 서비스 운영 정책에 위배되는 게시물은 사전 통보 없이 삭제 또는 블라인드 처리될 수 있습니다.

제8조 하드웨어 연동 및 데이터 관리
사용자는 회사가 지원하는 웨어러블 기기를 연동하여 반려동물의 생체 데이터(심박수, 운동량 등)를 수집 및 관리할 수 있습니다. 
사용자의 기기 파손, 통신 장애, 오작동 등으로 인한 데이터 유실이나 측정오류에 대하여 회사는 책임지지 않습니다.`,
    },
    {
      id: "privacy",
      title: "(필수) 개인정보 수집 및 이용 동의",
      content: `Arf-ly는 회원가입 및 서비스 제공을 위하여 아래와 같이 개인정보를 수집·이용합니다.
1. 수집 항목
- 이메일
- 비밀번호
- 전화번호
- 닉네임
- 반려동물 정보(이름, 품종, 성별, 나이 등)
- 회원이 업로드한 사진
- 소셜 로그인 이용 시 제공받는 계정 정보
- 서비스 이용 과정에서 생성되는 기록 정보

2. 수집 및 이용 목적
- 회원가입 및 로그인 처리
- 본인 확인 및 전화번호 인증
- 반려동물 정보 등록 및 관리
- AI 분석 및 건강 리포트 제공
- 커뮤니티 기능 제공
- 고객 문의 대응
- 서비스 운영, 오류 확인 및 품질 개선

3. 보유 및 이용 기간
회원 탈퇴 시까지 보유 및 이용합니다. 다만, 관계 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관할 수 있습니다.

4. 동의 거부 권리 및 불이익
이용자는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 다만, 필수 항목에 대한 동의를 거부할 경우 회원가입 및 서비스 이용이 제한될 수 있습니다.`,
    },
    {
      id: "ai_ref",
      title: "(필수) AI 결과가 참고용 정보 이해 동의",
      content: `Arfly에서 제공하는 AI 분석 결과는 반려동물의 피부 상태에 대한 참고용 정보일 뿐,
수의학적 진단이나 치료를 대체하지 않습니다.

이용자는 서비스에서 제공하는 결과를 기반으로 한 모든 판단과 행동에 대해
전적으로 본인의 책임 하에 결정하여야 합니다.

회사는 AI 분석 결과의 정확성, 신뢰성, 완전성을 보장하지 않으며,
해당 결과를 이용함으로써 발생하는 어떠한 손해에 대해서도 책임을 지지 않습니다.`,
    },
    {
      id: "location",
      title: "(필수) 위치기반서비스 이용 동의",
      content: `Arfly는 사용자의 현재 위치 정보를 활용하여 맞춤형 서비스를 제공합니다. 아래 내용을 확인하신 후 동의 여부를 선택해 주시기 바랍니다.
1. 서비스의 목적
회사는 수집된 위치 정보를 활용하여 다음과 같은 서비스를 제공합니다.
주변 병원 추천: 사용자 위치 기반 인근 동물병원 정보 제공
IoT 기기 위치 확인: 반려동물에게 부착된 IoT 기기의 위치 정보를 기반으로 반려동물의 현재 위치 또는 최근 위치를 확인할 수 있는 서비스 제공

2. 개인위치정보의 보유 및 이용기간
회사는 위치정보법 제16조 제2항에 따라 위치정보 이용·제공사실 확인자료를 6개월간 보관합니다.
사용자가 서비스 이용을 중단하거나 동의를 철회하는 경우, 수집된 위치정보는 즉시 파기됩니다. (단, 관련 법령에 의해 보존이 필요한 경우 제외)

3. 개인위치정보주체의 권리
귀하는 언제든지 위치정보 서비스의 동의 전부 또는 일부를 철회할 수 있습니다.
귀하는 회사가 수집한 본인의 위치정보 및 제공사실 확인자료의 열람 및 오류 정정을 요구할 수 있습니다.

4. 위치 정보 보호 책임자 정보
성명: 김초롱
연락처: chorong@email.com`,
    },
    {
      id: "ai_collect",
      title: "(선택) AI 정보 수집 동의",
      content: `운영자는 회원이 서비스에 업로드하거나 입력한 반려동물 사진 및 관련 정보를 활용하여 서비스 품질 개선 및 AI 기능 향상을 위한 연구·개선 작업을 수행할 수 있습니다.
1. 활용 대상 정보
반려동물 피부 사진
반려동물 프로필 정보(예: 품종, 나이, 성별, 체중, 알레르기 정보 등)
분석 결과 및 이용 과정에서 생성된 오류·성능 개선용 정보

2. 활용 목적
AI 분석 정확도 및 품질 향상
오진 가능성 감소 및 결과 표현 개선
서비스 기능 개선 및 사용자 경험 향상
모델 성능 검증, 테스트 및 운영 안정화

3. 처리 방식
운영자는 관련 법령에 따라 필요한 보호조치를 적용하여 정보를 처리합니다.
회원의 정보는 서비스 제공 목적과 구별하여 개선·학습 목적으로 활용될 수 있습니다.

4. 철회
회원은 언제든지 해당 동의를 철회할 수 있습니다.`,
    },
    {
      id: "push",
      title: "(선택) 푸시 알림 및 수신 동의",
      content: `회원은 Arfly 서비스 이용과 관련하여 다음과 같은 안내를 푸시 알림, 앱 내 알림, 문자 또는 이메일 등의 방법으로 받을 수 있습니다.
1. 계정 및 회원가입 관련 안내
회원가입 완료, 로그인 보안 안내, 비밀번호 재설정, 계정 보호 관련 알림

2. 일정 및 맞춤 알림 관련 안내
회원이 직접 설정한 복약 알림, 케어 일정, 반복 알림, 리마인드 알림`,
    },
    {
      id: "night",
      title: "(선택) 야간 수신 동의",
      content: `운영자는 회원이 서비스에 업로드하거나 입력한 반려동물 사진 및 관련 정보를 활용하여 서비스 품질 개선 및 AI 기능 향상을 위한 연구·개선 작업을 수행할 수 있습니다.
관련 법령에 따라 야간 시간대(21:00 ~ 익일 08:00)에 광고성 알림을 전송하기 위해서는 별도의 동의가 필요합니다.
주의: 반려동물의 생체 신호 이상 등 긴급 건강 알림은 야간 동의 여부와 관계없이 전송될 수 있습니다.`,
    },
  ];

  /** 전체 약관의 동의 상태를 한 번에 전환한다. */
  const handleAllAgree = () => {
    const newVal = !allAgreed;
    setAllAgreed(newVal);
    const newAgreements = {};
    Object.keys(agreements).forEach((key) => {
      newAgreements[key] = newVal;
    });
    setAgreements(newAgreements);
  };

  /** 선택한 약관의 동의 상태를 전환한다. */
  const handleToggle = (id) => {
    const newAgreements = { ...agreements, [id]: !agreements[id] };
    setAgreements(newAgreements);
    setAllAgreed(Object.values(newAgreements).every((val) => val));
  };

  /** 필수 약관 동의를 확인하고 완료 콜백에 동의 결과를 전달한다. */
  const handleNextBtn = () => {
    if (
      !agreements.service ||
      !agreements.privacy ||
      !agreements.ai_ref ||
      !agreements.location
    ) {
      alert("필수 약관에 모두 동의해주세요.");
      return;
    }

    if (onComplete) {
      onComplete(agreements);
    }
  };

  if (detailView) {
    return (
      <div className="terms-page">
        <header className="detail-header">
          <button className="back-btn" onClick={() => setDetailView(null)}>
            <img src={backbtn} alt="뒤로가기" />
          </button>
          <h2>{detailView.title}</h2>
        </header>

        <div className="detail-content">
          <p className="normal-text">
            {detailView.content.split("\n").map((line, index) => {
              const isHeading = /^(제\d+조|\d+\.)/.test(line.trim());
              return (
                <React.Fragment key={index}>
                  {isHeading ? <strong>{line}</strong> : line}
                  <br />
                </React.Fragment>
              );
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="terms-page">
      <header className="terms-header" />

      <div className="terms-main">
        <h1 className="terms-title">아플리 사용을 위해 동의가 필요해요</h1>

        <div className="terms-agree-all" onClick={handleAllAgree}>
          <img
            src={allAgreed ? pinkCheckCircle : grayCheckCircle}
            alt="전체 동의"
            className="checkbox-icon"
          />
          <div className="agree-all-text">
            <h2>모두 동의 하기</h2>
            <p className="subtitle">
              서비스 이용에 필수적인 최소한의 개인정보 수집 및 이용, 본인확인,
              위치정보 수집 및 이용, 마케팅 정보 수신(선택), 맞춤형 광고
              수신(선택)을 포함합니다.
            </p>
          </div>
        </div>

        <div className="terms-divider"></div>

        <ul className="terms-list">
          {termsList.map((term) => (
            <li key={term.id} className="terms-list-item">
              <div className="item-left" onClick={() => handleToggle(term.id)}>
                <img
                  src={agreements[term.id] ? pinkCheck : grayCheck}
                  alt="동의 체크"
                  className="list-check-icon"
                />
                <span className="term-title">{term.title}</span>
              </div>
              <button
                className="item-right-btn"
                onClick={() => setDetailView(term)}
              >
                <img src={nextIcon} alt="상세 보기" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="terms-footer">
        <button className="next-btn" onClick={handleNextBtn}>
          다음
        </button>
      </div>
    </div>
  );
};

export default Terms;
