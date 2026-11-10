import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./PetRegister.css";

import BackIcon from "../../assets/pet/register/back.svg";
import CheckIcon from "../../assets/pet/register/check.svg";
import FemaleIcon from "../../assets/pet/register/female.svg";
import MaleIcon from "../../assets/pet/register/male.svg";
import PlusIcon from "../../assets/pet/register/plus.svg";
import SearchIcon from "../../assets/pet/register/search.svg";
import Profile1Svg from "../../assets/pet/register/profile1.svg";
import Profile2Svg from "../../assets/pet/register/profile2.svg";
import Profile3Svg from "../../assets/pet/register/profile3.svg";
import Profile4Svg from "../../assets/pet/register/profile4.svg";
import Profile5Svg from "../../assets/pet/register/profile5.svg";
import Profile6Svg from "../../assets/pet/register/profile6.svg";
import Profile7Svg from "../../assets/pet/register/profile7.svg";
import Profile8Svg from "../../assets/pet/register/profile8.svg";
import Profile1Png from "../../assets/pet/register/profile1.png";
import Profile2Png from "../../assets/pet/register/profile2.png";
import Profile3Png from "../../assets/pet/register/profile3.png";
import Profile4Png from "../../assets/pet/register/profile4.png";
import Profile5Png from "../../assets/pet/register/profile5.png";
import Profile6Png from "../../assets/pet/register/profile6.png";
import Profile7Png from "../../assets/pet/register/profile7.png";
import Profile8Png from "../../assets/pet/register/profile8.png";
import CancleIcon from "../../assets/pet/register/cancel.svg";

const API_BASE_URL = import.meta.env.VITE_SERVER_API_BASE_URL;

const profileImages = [
  { preview: Profile1Svg, upload: Profile1Png },
  { preview: Profile2Svg, upload: Profile2Png },
  { preview: Profile3Svg, upload: Profile3Png },
  { preview: Profile4Svg, upload: Profile4Png },
  { preview: Profile5Svg, upload: Profile5Png },
  { preview: Profile6Svg, upload: Profile6Png },
  { preview: Profile7Svg, upload: Profile7Png },
  { preview: Profile8Svg, upload: Profile8Png },
];

const initialForm = {
  name: "",
  age: "",
  neutered: "",
  gender: "",
  breed: "",
  weight: "",
  memo: "",
};

/** 서버의 반려동물 종류를 등록 화면의 선택 값으로 변환한다. */
const getPetTypeFromSpecies = (species) =>
  String(species).toUpperCase() === "CAT" ? "cat" : "dog";

/** 기존 반려동물 정보를 수정 폼의 초기 입력값으로 변환한다. */
const createEditForm = (pet = {}) => ({
  name: pet.name ? String(pet.name) : "",
  age: pet.age ? String(pet.age) : "",
  neutered: pet.neuter ? "yes" : "no",
  gender: pet.sex || "",
  breed: pet.breed || "",
  weight: pet.weight || pet.weight === 0 ? String(pet.weight) : "",
  memo: pet.note || "",
});

/** 품종 조회 응답에서 비어 있지 않은 품종 이름 목록을 추출한다. */
const normalizeBreedList = (data) => {
  const list = Array.isArray(data) ? data : data?.breeds || data?.data || [];

  return list
    .map((breed) => {
      if (typeof breed === "string") return breed;
      return breed?.name || breed?.breed || breed?.breeds || "";
    })
    .filter(Boolean);
};

/** 반려동물 종류, 기본 정보와 프로필 입력을 받아 등록 또는 수정을 진행한다. */
const PetRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const entry = location.state?.entry;
  const editPet = location.state?.pet;
  const isSignupFlow = entry === "signup";
  const isHomeTermsFlow = entry === "home";
  const isEditFlow = entry === "edit" && Boolean(editPet?.id);
  const isMyPageAddFlow = entry === "mypage-add";
  const finishPath = isSignupFlow || isHomeTermsFlow ? "/home" : "/mypage";

  const [step, setStep] = useState(isEditFlow ? "info" : "type");
  const [petType, setPetType] = useState(
    isEditFlow ? getPetTypeFromSpecies(editPet.species) : "",
  );
  const [form, setForm] = useState(
    isEditFlow ? createEditForm(editPet) : initialForm,
  );
  const [errors, setErrors] = useState({});
  const [breedSearch, setBreedSearch] = useState(
    isEditFlow ? editPet.breed || "" : "",
  );
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [allergySheetOpen, setAllergySheetOpen] = useState(false);
  const [allergyInput, setAllergyInput] = useState("");
  const [allergies, setAllergies] = useState(
    isEditFlow && Array.isArray(editPet.allergic) ? editPet.allergic : [],
  );
  const [profileImage, setProfileImage] = useState(
    isEditFlow ? editPet.img || "" : "",
  );
  const [profileUploadImage, setProfileUploadImage] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [breedOptions, setBreedOptions] = useState([]);
  const [isBreedLoading, setIsBreedLoading] = useState(false);
  const [breedError, setBreedError] = useState("");

  const species = petType === "dog" ? "DOG" : "CAT";

  const filteredBreeds = useMemo(() => {
    if (!breedSearch.trim()) return breedOptions;
    return breedOptions.filter((breed) => breed.includes(breedSearch.trim()));
  }, [breedOptions, breedSearch]);

  const isTypeSelected = petType !== "";
  const isFormReady =
    form.name.trim() &&
    form.age.trim() &&
    form.neutered &&
    form.gender &&
    form.breed.trim();

  /** 지정한 반려동물 입력값을 갱신하고 해당 항목의 오류를 초기화한다. */
  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  /** 숫자 이외의 문자를 제거한 뒤 입력값을 갱신한다. */
  const updateNumericForm = (field, value) => {
    updateForm(field, value.replace(/[^0-9]/g, ""));
  };

  /** 체중에 사용할 숫자와 소수점만 남겨 입력값을 갱신한다. */
  const updateWeightForm = (value) => {
    const numericValue = value
      .replace(/[^0-9.]/g, "")
      .replace(/(\..*)\./g, "$1");

    updateForm("weight", numericValue);
  };

  /** 입력한 나이를 출생 연도의 1월 1일 문자열로 변환한다. */
  const getBirthFromAge = (age) => {
    const birthYear = new Date().getFullYear() - Number(age);
    return `${birthYear}-01-01`;
  };

  /** 반려동물 입력값을 서버가 요구하는 자료형과 필드로 구성한다. */
  const createPetPayload = () => ({
    neutered: form.neutered === "yes",
    sex: form.gender === "male" ? "MALE" : "FEMALE",
    name: form.name.trim(),
    note: form.memo.trim(),
    weight: form.weight ? Number(form.weight) : 0,
    species,
    allergies,
    birth: getBirthFromAge(form.age),
    breeds: form.breed.trim(),
  });

  /** 업로드할 프로필 파일을 선택하거나 기본 이미지에서 파일을 생성한다. */
  const createProfileImageFile = async () => {
    if (profileFile) return profileFile;
    if (isEditFlow && profileImage === editPet?.img) return null;
    if (!profileImage) return null;

    const imageToUpload = profileUploadImage || profileImage;
    const response = await fetch(imageToUpload);
    const blob = await response.blob();
    const extension = blob.type.split("/")[1] || "png";

    return new File([blob], `pet-profile.${extension}`, {
      type: blob.type || "image/png",
    });
  };

  /** 반려동물 정보와 프로필 파일을 multipart 전송 본문으로 구성한다. */
  const createPetFormData = async () => {
    const data = createPetPayload();
    const imageFile = await createProfileImageFile();
    const formData = new FormData();

    formData.append(
      "request",
      new Blob([JSON.stringify(data)], {
        type: "application/json",
      }),
    );

    if (imageFile) {
      formData.append("file", imageFile);
    }

    return formData;
  };

  /** 선택한 중성화 여부를 표시용 문구로 반환한다. */
  const getNeuteredLabel = () =>
    form.neutered === "yes" ? "중성화 완료" : "중성화 미완료";

  /** 선택한 반려동물 성별에 맞는 아이콘을 반환한다. */
  const getGenderIcon = () => (form.gender === "male" ? MaleIcon : FemaleIcon);

  /** 등록 진입 경로에 맞는 완료 화면으로 이동한다. */
  const finishRegister = () => {
    navigate(finishPath, { replace: true });
  };

  /** 추가 반려동물을 입력할 수 있도록 등록 상태를 초기화한다. */
  const handleAddAnotherPet = () => {
    setStep("type");
    setPetType("");
    setForm(initialForm);
    setErrors({});
    setBreedSearch("");
    setAllergies([]);
    setAllergyInput("");
    setProfileImage("");
    setProfileUploadImage("");
    setProfileFile(null);
    setBreedOptions([]);
    setBreedError("");
  };

  /** 등록 단계와 진입 경로에 따라 이전 입력 단계 또는 화면으로 돌아간다. */
  const handleBack = () => {
    if (step === "complete") {
      finishRegister();
      return;
    }

    if (step === "breed") {
      setStep("info");
      return;
    }

    if (step === "info") {
      if (isEditFlow) {
        navigate(-1);
        return;
      }

      setStep("type");
      return;
    }

    if (isSignupFlow || isHomeTermsFlow) {
      navigate("/home", { replace: true });
      return;
    }

    navigate(-1);
  };

  /** 선택한 반려동물 종류에 따라 정보 입력으로 이동하거나 등록을 마친다. */
  const handleTypeNext = () => {
    if (!petType) return;
    if (petType === "none") {
      finishRegister();
      return;
    }
    setStep("info");
  };

  /** 반려동물 종류를 선택하고 이전 품종 선택과 조회 상태를 초기화한다. */
  const handlePetTypeSelect = (nextPetType) => {
    setPetType(nextPetType);
    updateForm("breed", "");
    setBreedSearch("");
    setBreedOptions([]);
    setBreedError("");
  };

  /** 필수 반려동물 입력 항목을 검증하고 항목별 오류를 표시한다. */
  const validateForm = () => {
    const nextErrors = {};
    if (!form.name.trim()) {
      nextErrors.name = "*이름은 필수 입력항목입니다.";
    }
    if (!form.age.trim()) {
      nextErrors.age = "*나이는 필수 입력항목입니다.";
    }
    if (!form.neutered) {
      nextErrors.neutered = "*중성화 여부는 필수 입력항목입니다.";
    }
    if (!form.gender) {
      nextErrors.gender = "*성별은 필수 입력항목입니다.";
    }
    if (!form.breed.trim()) {
      nextErrors.breed = "*품종은 필수 입력항목입니다.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /** 입력값과 로그인 상태를 확인한 뒤 반려동물을 등록하거나 수정한다. */
  const handleInfoNext = async () => {
    if (!validateForm()) return;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      alert("로그인이 필요합니다.");
      navigate("/login", { replace: true });
      return;
    }

    try {
      setIsSubmitting(true);

      const requestPath = isEditFlow ? `/api/pets/${editPet.id}` : "/api/pets";
      const response = await fetch(`${API_BASE_URL}${requestPath}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: await createPetFormData(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            (isEditFlow
              ? "반려동물 수정에 실패했습니다."
              : "반려동물 등록에 실패했습니다."),
        );
      }

      if (isEditFlow || isMyPageAddFlow) {
        navigate("/mypage", { replace: true });
        return;
      }

      setStep("complete");
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /** 선택한 프로필 파일과 미리보기를 반영하고 이미지 선택 창을 닫는다. */
  const handleProfileFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProfileImage(URL.createObjectURL(file));
    setProfileUploadImage("");
    setProfileFile(file);
    setProfileSheetOpen(false);
  };

  /** 중복되지 않은 알레르기 항목을 추가하고 입력값을 비운다. */
  const addAllergy = () => {
    const nextAllergy = allergyInput.trim();
    if (!nextAllergy) return;

    if (allergies.includes(nextAllergy)) {
      setAllergyInput("");
      return;
    }

    setAllergies((prev) => [...prev, nextAllergy]);
    setAllergyInput("");
  };

  /** 입력 중인 알레르기를 추가한 뒤 알레르기 입력 시트를 닫는다. */
  const closeAllergySheet = () => {
    addAllergy();
    setAllergySheetOpen(false);
  };

  /** 선택한 알레르기 항목을 목록에서 제거한다. */
  const removeAllergy = (target) => {
    setAllergies((prev) => prev.filter((allergy) => allergy !== target));
  };

  /** 선택한 품종을 등록 폼과 검색 입력에 반영한다. */
  const selectBreed = (breed) => {
    updateForm("breed", breed);
    setBreedSearch(breed);
  };

  useEffect(() => {
    if (step !== "breed" || !petType || petType === "none") return;

    /** 선택한 반려동물 종류에 맞는 품종을 조회하고 목록과 오류 상태를 갱신한다. */
    const fetchBreeds = async () => {
      const accessToken = localStorage.getItem("accessToken");

      try {
        setIsBreedLoading(true);
        setBreedError("");

        const response = await fetch(
          `${API_BASE_URL}/api/pets/breeds?species=${species}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || "품종 목록을 불러오지 못했습니다.",
          );
        }

        const data = await response.json();
        setBreedOptions(normalizeBreedList(data));
      } catch (error) {
        setBreedError(error.message);
        setBreedOptions([]);
      } finally {
        setIsBreedLoading(false);
      }
    };

    fetchBreeds();
  }, [petType, species, step]);

  return (
    <main className="PetRegisterWrapper">
      <header className="PetRegisterHeader">
        <button
          type="button"
          className="PetRegisterBackBtn"
          onClick={handleBack}
        >
          <img src={BackIcon} alt="뒤로가기" />
        </button>
        <h1>
          {isEditFlow ? "수정" : step === "breed" ? "품종 찾기" : "프로필 등록"}
        </h1>
      </header>

      {step === "type" && (
        <>
          <section className="PetTypeSection">
            <h2>어떤 친구와 함께 지내고 있나요?</h2>
            <div className="PetTypeGrid">
              <button
                type="button"
                className={`PetTypeCard ${petType === "dog" ? "selected" : ""}`}
                onClick={() => handlePetTypeSelect("dog")}
              >
                강아지
              </button>
              <button
                type="button"
                className={`PetTypeCard ${petType === "cat" ? "selected" : ""}`}
                onClick={() => handlePetTypeSelect("cat")}
              >
                고양이
              </button>
            </div>
            <button
              type="button"
              className={`PetTypeNone ${petType === "none" ? "selected" : ""}`}
              onClick={() => handlePetTypeSelect("none")}
            >
              없음
            </button>
          </section>

          <button
            type="button"
            className={`PetRegisterBottomBtn ${isTypeSelected ? "active" : ""}`}
            onClick={handleTypeNext}
            disabled={!isTypeSelected}
          >
            다음
          </button>
        </>
      )}

      {step === "info" && (
        <>
          <section className="PetInfoSection">
            <h2>반려동물 정보</h2>
            <p>입력해주신 정보로 더 정확한 진단과 관리 방법을 안내해드려요!</p>

            <div className="ProfileField">
              <span>프로필 사진</span>
              <button
                type="button"
                className={`ProfileImageButton ${isEditFlow ? "edit" : ""}`}
                onClick={() => setProfileSheetOpen(true)}
              >
                {profileImage && <img src={profileImage} alt="선택한 프로필" />}
                <span className="ProfilePlus">
                  <img src={PlusIcon} alt="" />
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="PetRegisterFileInput"
                onChange={handleProfileFileChange}
              />
            </div>

            <label className="PetField">
              <span>이름*</span>
              <input
                type="text"
                value={form.name}
                placeholder="이름을 입력해주세요."
                className={errors.name ? "error" : ""}
                onChange={(event) => updateForm("name", event.target.value)}
              />
              {errors.name && <small>{errors.name}</small>}
            </label>

            <label className="PetField">
              <span>나이*</span>
              <input
                type="text"
                value={form.age}
                inputMode="numeric"
                placeholder="나이를 숫자로 입력해주세요."
                className={errors.age ? "error" : ""}
                onChange={(event) =>
                  updateNumericForm("age", event.target.value)
                }
              />
              {errors.age && <small>{errors.age}</small>}
            </label>

            <div className="PetField">
              <span>중성화 여부*</span>
              <div className="PetToggleRow">
                <button
                  type="button"
                  className={form.neutered === "yes" ? "selected" : ""}
                  onClick={() => updateForm("neutered", "yes")}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={form.neutered === "no" ? "selected" : ""}
                  onClick={() => updateForm("neutered", "no")}
                >
                  No
                </button>
              </div>
              {errors.neutered && <small>{errors.neutered}</small>}
            </div>

            <div className="PetField">
              <span>성별*</span>
              <div className="PetToggleRow">
                <button
                  type="button"
                  className={form.gender === "male" ? "selected" : ""}
                  onClick={() => updateForm("gender", "male")}
                >
                  왕자님
                </button>
                <button
                  type="button"
                  className={form.gender === "female" ? "selected" : ""}
                  onClick={() => updateForm("gender", "female")}
                >
                  공주님
                </button>
              </div>
              {errors.gender && <small>{errors.gender}</small>}
            </div>

            <div className="PetField">
              <span>품종*</span>
              <button
                type="button"
                className={`PetSearchInput ${errors.breed ? "error" : ""}`}
                onClick={() => setStep("breed")}
              >
                <span className={form.breed ? "" : "placeholder"}>
                  {form.breed || "품종을 검색하여 찾아보세요."}
                </span>
                <img src={SearchIcon} alt="" />
              </button>
              {errors.breed && <small>{errors.breed}</small>}
            </div>

            <label className="PetField">
              <span>몸무게</span>
              <input
                type="text"
                inputMode="decimal"
                value={form.weight}
                placeholder="무게를 숫자로 입력해주세요."
                onChange={(event) => updateWeightForm(event.target.value)}
              />
            </label>

            <div className="PetField">
              <span>알레르기 정보</span>
              <div className="AllergyPreview">
                <button type="button" onClick={() => setAllergySheetOpen(true)}>
                  <img src={PlusIcon} alt="추가" />
                </button>
                {allergies.map((allergy) =>
                  isEditFlow ? (
                    <button
                      className="AllergyPreviewChip"
                      type="button"
                      key={allergy}
                      onClick={() => removeAllergy(allergy)}
                    >
                      <span>{allergy}</span>
                      <img src={CancleIcon} alt="삭제" />
                    </button>
                  ) : (
                    <span key={allergy}>{allergy}</span>
                  ),
                )}
              </div>
            </div>

            <label className="PetField">
              <span>특이사항</span>
              <input
                type="text"
                value={form.memo}
                placeholder="특이사항을 입력해주세요."
                onChange={(event) => updateForm("memo", event.target.value)}
              />
            </label>
          </section>

          <button
            type="button"
            className={`PetRegisterBottomBtn ${isFormReady ? "active" : ""}`}
            onClick={handleInfoNext}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isEditFlow
                ? "수정 중"
                : "등록 중"
              : isEditFlow
                ? "수정 완료"
                : isMyPageAddFlow
                  ? "프로필 만들기"
                : "다음"}
          </button>
        </>
      )}

      {step === "breed" && (
        <>
          <section className="BreedSearchSection">
            <label className="PetField">
              <span>품종</span>
              <div className="BreedSearchInput">
                <input
                  type="text"
                  value={breedSearch}
                  placeholder="품종을 검색하여 찾아보세요."
                  autoFocus
                  onChange={(event) => setBreedSearch(event.target.value)}
                />
                <img src={SearchIcon} alt="" />
              </div>
            </label>

            <div className="BreedList">
              {isBreedLoading && (
                <p className="BreedStatusText">
                  품종 목록을 불러오는 중입니다.
                </p>
              )}

              {!isBreedLoading && breedError && (
                <p className="BreedStatusText error">{breedError}</p>
              )}

              {!isBreedLoading &&
                !breedError &&
                filteredBreeds.length === 0 && (
                  <p className="BreedStatusText">검색 결과가 없습니다.</p>
                )}

              {!isBreedLoading &&
                !breedError &&
                filteredBreeds.map((breed, index) => {
                  const isSelected = form.breed === breed;
                  return (
                    <button
                      type="button"
                      key={`${breed}-${index}`}
                      className={isSelected ? "selected" : ""}
                      onClick={() => selectBreed(breed)}
                    >
                      <span>{breed}</span>
                      {isSelected && <img src={CheckIcon} alt="선택됨" />}
                    </button>
                  );
                })}
            </div>
          </section>

          <button
            type="button"
            className={`PetRegisterBottomBtn ${form.breed ? "active" : ""}`}
            onClick={() => setStep("info")}
            disabled={!form.breed}
          >
            완료
          </button>
        </>
      )}

      {step === "complete" && (
        <>
          <section className="PetCompleteSection">
            <h2>
              {form.name}의 프로필이
              <br />
              완성되었어요!
            </h2>

            <div className="PetCompleteCard">
              <div className="PetCompleteBadges">
                <span className="GenderBadge">
                  <img src={getGenderIcon()} alt="" />
                </span>
                <span>{getNeuteredLabel()}</span>
              </div>

              <div className="PetCompleteProfile">
                {profileImage && (
                  <img src={profileImage} alt={`${form.name} 프로필`} />
                )}
              </div>

              <strong>
                {form.name} ({form.age})
              </strong>
              <p>{form.breed}</p>
              {form.weight.trim() && <p>{form.weight}kg</p>}

              {allergies.length > 0 && (
                <div className="PetCompleteInfoBlock">
                  <span>알레르기 정보</span>
                  <div className="PetCompleteChips">
                    {allergies.map((allergy) => (
                      <em key={allergy}>{allergy}</em>
                    ))}
                  </div>
                </div>
              )}

              {form.memo.trim() && (
                <div className="PetCompleteInfoBlock">
                  <span>특이사항</span>
                  <div className="PetCompleteNote">{form.memo}</div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="PetAddMoreButton"
              onClick={handleAddAnotherPet}
            >
              <img src={PlusIcon} alt="" />
              <span>반려동물 더 키워요!</span>
            </button>
          </section>

          <button
            type="button"
            className="PetRegisterBottomBtn active"
            onClick={finishRegister}
          >
            완료
          </button>
        </>
      )}

      {profileSheetOpen && (
        <div
          className="PetSheetOverlay"
          onClick={() => setProfileSheetOpen(false)}
        >
          <section
            className="PetBottomSheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ProfileActionRow">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                사진 촬영
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                갤러리
              </button>
            </div>
            <div className="ProfileImageGrid">
              {profileImages.map((image, index) => (
                <button
                  type="button"
                  key={image.preview}
                  onClick={() => {
                    setProfileImage(image.preview);
                    setProfileUploadImage(image.upload);
                    setProfileFile(null);
                    setProfileSheetOpen(false);
                  }}
                >
                  <img src={image.preview} alt={`프로필 ${index + 1}`} />
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {allergySheetOpen && (
        <div
          className="PetSheetOverlay"
          onClick={() => setAllergySheetOpen(false)}
        >
          <section
            className="PetBottomSheet AllergySheet"
            onClick={(event) => event.stopPropagation()}
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                addAllergy();
              }}
            >
              <input
                type="text"
                value={allergyInput}
                placeholder="직접 알레르기를 입력해주세요."
                autoFocus
                onChange={(event) => setAllergyInput(event.target.value)}
              />
            </form>
            <div className="AllergyChipList">
              {allergies.map((allergy) => (
                <button
                  type="button"
                  key={allergy}
                  onClick={() => removeAllergy(allergy)}
                >
                  {allergy}
                  <span>×</span>
                </button>
              ))}
            </div>
          </section>
          <button
            type="button"
            className="PetRegisterBottomBtn PetSheetDone active"
            onClick={closeAllergySheet}
          >
            완료
          </button>
        </div>
      )}
    </main>
  );
};

export default PetRegister;
