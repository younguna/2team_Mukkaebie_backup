
import StoreUtil from "./Util.js"



export class MKBComment {

  constructor(storeId, topThreeList) {

    this.storeId = storeId;
    this.topThreeList = topThreeList;
    this.buildMKBModal(storeId, topThreeList);


    this.sendImage(storeId, topThreeList)
            .then(this.setProfilePics)
            .then(this.postComment)
            .then(this.applyChange)
  }

  initialRendering(){
    this.getComment(this.storeId, this.topThreeList)
        .then(this.renderContent);
  }



  buildMKBModal(id) {

    let modal = document.querySelector('#mkbModal');
    let modalBtn = Array.from(document.querySelectorAll(".mkbProfileImgs"));
    let closeBtn = document.querySelector(".mkbModalClose");


    modalBtn.forEach(function (circle) {

      circle.addEventListener("click", function (event) {

        StoreUtil.showModal('#mkbModal');



        function getResponse() {
          return new Promise(function (resolve) {
            StoreUtil.ajaxGet(SERVER_BASE_URL + "/stores/" + id, getResponseCb);

            function getResponseCb(){
              const response = JSON.parse(this.responseText);
              resolve(response)
            }
          })
        }

        const renderModal = (res) => {


          // 로그인 정보랑 맞을시만 수정버튼보이게 하는 부분
          if (this.attributes["data-user"]["value"] != session) {
            StoreUtil.changeDisplay(".mkbEdit", "none");
          }
          else{
            StoreUtil.changeDisplay(".mkbEdit", "block");
            document.querySelector(".mkbEdit").innerText = "수정";
          }

          //클릭시 보이는 사진 부분 설정하는 부분
          const previewTarget = document.querySelector(".mkbImgPreview");
          previewTarget.style.backgroundImage = event.target.style.backgroundImage;



          const mkbResponse = res[0]["mkb"] ? res[0]["mkb"] : [];
          let clickedUser = "";

          if (this.attributes["data-user"] != undefined || this.attributes["data-user"] != null) {

            let clickedUser = this.attributes["data-user"]["value"];
            let clickedMkb = [];

            let clickeMkbData = mkbResponse.filter(function (mkb) {
              return mkb["userId"] == clickedUser;
            });

            if (clickeMkbData.length > 0) {
              clickedMkb = clickeMkbData[clickeMkbData.length - 1];
            }


            //textinput 바꾸는 부분
            if (clickedMkb) {
              document.getElementById("commentTextInput")["value"] = clickedMkb["mkbComment"];
            }
            else {
              document.getElementById("commentTextInput")["value"] = "";
            }


            // 모달 클릭시 보이는 부분
            const mkbComment = document.querySelector("#mkbComment");
            const mkbCommentUserId = document.querySelector("#mkbCommentUserId");
            const commentUser = document.querySelector(".commentWriteBox p");

            commentUser.innerText = clickedUser;
            commentUser.setAttribute("value", this.attributes["value"]["value"]);
            if (clickedUser === ""){
              mkbComment.innerText = "먹깨비 없음";
            }
            else if (clickedMkb["mkbComment"] == undefined) {
              mkbComment.innerText = "우하하 나는 먹깨비다!";
            } else {
              mkbComment.innerText = clickedMkb["mkbComment"];
            }
            mkbCommentUserId.innerText = clickedUser;
          }
        }

        getResponse().then(renderModal);


      });



    });


    closeBtn.addEventListener("click", function () {
      const editBox = document.querySelector(".logInRequired");
      const editBtn = document.querySelector(".mkbEdit");
      modal.style.opacity = "0";

      setTimeout(function () {
        modal.style.display = "none";
        editBox.classList.remove("mkbShow");
        editBtn.classList.remove("mkbHide");
      }, 200)
    });
  }

  getComment(storeId, top3List) {
    return new Promise(function (resolve) {

      function getCommentCb(){
        const response = JSON.parse(this.responseText);
        const renderTarget = document.querySelector("#mkbComment");
        let targetArr = (response[0].mkb) ? response[0].mkb : [];
        let finalMkbList = [];
        top3List.forEach(function (topBuyer) {
          let oneBuyer = targetArr.filter(function (mkbRow) {
            return mkbRow.userId == topBuyer;
          });

          if (oneBuyer.length > 0) {
            finalMkbList.push(oneBuyer[oneBuyer.length - 1]);
          } else {
            finalMkbList.push(topBuyer);
          }
        });

        resolve({"finalMkbList":finalMkbList, "storeId": storeId});
      }

      StoreUtil.ajaxGet(SERVER_BASE_URL + "/stores/" + storeId, getCommentCb)

    });
  }

  renderContent(inputObj){
    const mkbLevelList = ["gold", "silver", "bronze"];
    const mkbOutsideCommentId = document.querySelector("#mkbCommentOutsideId");
    const mkbOutsideCommentMsg = document.querySelector("#mkbCommentOutsideMsg");

    inputObj["finalMkbList"].forEach(function(comment, idx){
      console.log(comment)
      const mkbLevel = mkbLevelList[idx];
      const profilePicSmall = document.querySelector("." + mkbLevel + "Img");

      if (typeof(comment) === "string") {
        profilePicSmall.setAttribute("data-user", comment);
        profilePicSmall.style.backgroundImage = "url('" + DEFAULT_PROFILE_IMG + "')";


      } else {
        profilePicSmall.setAttribute("data-user", comment["userId"]);
        profilePicSmall.style.backgroundImage = "url('" + comment['imgUrl'] + "')";
      }
      if (mkbLevel === "gold") {


        if (typeof(comment) === "string") {
          mkbOutsideCommentId.innerHTML = comment;
          mkbOutsideCommentMsg.innerHTML = "우하하! 나는 먹깨비다";
          if (comment === "") {
            mkbOutsideCommentId.innerHTML = "大 먹깨비 공석";
          }
        }
        else{
          mkbOutsideCommentMsg.innerHTML = comment["mkbComment"];
          mkbOutsideCommentId.innerHTML = comment["userId"];}

      }
      StoreUtil.setAttributes(profilePicSmall, {"value": mkbLevel,"data-store":inputObj["storeId"]})
    });
  }


  sendImage(storeId, topThreeList) {
    return new Promise(function (resolve) {
      const form = document.getElementById('file-form');
      const fileSelect = document.getElementById('file-select');

      form.onsubmit = function (event) {
        event.preventDefault();
        const file = fileSelect.files[0];
        let resolveObj = {
          "imgUrl": DEFAULT_PROFILE_IMG,
          "storeId":storeId,
          "topThreeList" : topThreeList
        }
        if (file != undefined) {
          const formData = new FormData();
          formData.append('profileImage', file);

          StoreUtil.ajaxPostWithCb(IMAGE_SERVER_POST, formData, sendImageCb);

          function sendImageCb(){
            const res = JSON.parse(this.responseText);
            resolveObj["imgUrl"] = IMAGE_SERVER_GET +res["filename"];
            resolve(resolveObj)
          }

        } else {
          resolve(resolveObj);
        }

        StoreUtil.changeOpacity("#mkbModal", "0");
        setTimeout(function () {
          StoreUtil.changeDisplay("#mkbModal", "none");
          document.querySelector(".logInRequired").classList.remove("mkbShow");
        }, 1000);
      }
    })
  }


  setProfilePics(inputObj){

    return new Promise(function (resolve) {
      const profilePic = document.querySelector(".mkbImgPreview");
      const clickedMkb = document.querySelector(".commentWriteBox p");
      const profilePicSmall = document.querySelector("." + clickedMkb.getAttribute("value") + "Img");
      console.log("pps", profilePicSmall);
      inputObj["targetLevel"] = clickedMkb.getAttribute("value");
      const uploadedPicUrl = "url('" + inputObj["imgUrl"] + "')";
      console.log("URL!!!", uploadedPicUrl);
      profilePic.style.backgroundImage = uploadedPicUrl;
      profilePicSmall.style.backgroundImage = uploadedPicUrl;
      resolve(inputObj);
    });
  }

  postComment(inputObj) {
    return new Promise(function (resolve) {

      const targetCircle = document.querySelector(".commentWriteBox p");
      const targetLevel = targetCircle.getAttribute("value");

      const commentTextInput = document.querySelector("#commentTextInput");
      const packet = {
        "storeId" : inputObj["storeId"],
        "mkb": {
          "mkbComment" : document.querySelector("#commentTextInput").value,
          "time" : new Date().toLocaleString(),
          "userId": targetCircle["innerText"],
          "imgUrl": inputObj["imgUrl"]
        }
      };
      StoreUtil.ajaxPost(SERVER_BASE_URL + "/stores/mkb/" + inputObj["storeId"], JSON.stringify(packet));
      resolve(inputObj);
    });
  }

  applyChange(inputObj){
    const imgUrl = inputObj["imgUrl"];
    const targetLevel = inputObj["targetLevel"];
    console.log(targetLevel);
    const targetLevelImg = document.querySelector("." + targetLevel + "Img");
    document.querySelector("#mkbComment").innerText = document.querySelector("#commentTextInput").value;

    if (targetLevel === "gold") {
      document.querySelector("#mkbCommentOutsideMsg").innerText = document.querySelector("#commentTextInput").value;
    }
    const newMkb = new MKBComment(inputObj["storeId"], inputObj["topThreeList"])
  }
}