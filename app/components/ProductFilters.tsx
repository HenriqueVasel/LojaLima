"use client";



import { useEffect, useState } from "react";



type AttributeValue = {

  id: number;

  value: string;

  slug: string;

};



type Attribute = {

  id: number;

  name: string;

  slug: string;

  values: AttributeValue[];

};



type Props = {

  category?: string;

};



export default function ProductFilters({

  category,

}: Props) {



  const [attributes, setAttributes] =

    useState<Attribute[]>([]);



  const [selected, setSelected] =

    useState<

      Record<string, string[]>

    >({});



  const [loading, setLoading] =

    useState(true);



  useEffect(() => {



    async function load() {



      try {



        const params =

          new URLSearchParams();



        if (category) {

          params.set(

            "category",

            category

          );

        }



        const res =

          await fetch(

            `/api/categories/attributes?${params.toString()}`

          );



        if (!res.ok) {

          setAttributes([]);

          return;

        }



        const data =

          await res.json();



        setAttributes(

          Array.isArray(data)

            ? data

            : data.attributes || []

        );



      } catch (error) {



        console.error(

          "Erro ao carregar filtros:",

          error

        );



      } finally {



        setLoading(false);

      }

    }



    load();



  }, [category]);



  function toggleValue(

    attributeSlug: string,

    valueSlug: string

  ) {



    setSelected(

      (current) => {



        const values =

          current[

            attributeSlug

          ] || [];



        const exists =

          values.includes(

            valueSlug

          );



        const next =

          exists

            ? values.filter(

                (value) =>

                  value !== valueSlug

              )

            : [

                ...values,

                valueSlug,

              ];



        return {

          ...current,

          [attributeSlug]:

            next,

        };

      }

    );

  }



  function clearFilters() {



    setSelected({});

  }



  if (loading) {



    return (

      <div>

        Carregando filtros...

      </div>

    );

  }



  if (!attributes.length) {



    return null;

  }



  return (

    <aside>



      <div

        style={{

          display: "flex",

          justifyContent:

            "space-between",

          alignItems: "center",

          marginBottom: 20,

        }}

      >



        <strong>

          Filtre por características

        </strong>



        <button

          type="button"

          onClick={clearFilters}

          style={{

            border: 0,

            background: "transparent",

            cursor: "pointer",

          }}

        >

          Limpar

        </button>



      </div>



      {attributes.map(

        (attribute) => (



          <div

            key={attribute.id}

            style={{

              marginBottom: 24,

            }}

          >



            <strong>

              {attribute.name}

            </strong>



            <div

              style={{

                marginTop: 10,

              }}

            >



              {attribute.values.map(

                (value) => {



                  const checked =

                    (

                      selected[

                        attribute.slug

                      ] || []

                    ).includes(

                      value.slug

                    );



                  return (

                    <label

                      key={value.id}

                      style={{

                        display: "flex",

                        alignItems:

                          "center",

                        gap: 8,

                        marginBottom: 8,

                        cursor: "pointer",

                      }}

                    >



                      <input

                        type="checkbox"

                        checked={checked}

                        onChange={() =>

                          toggleValue(

                            attribute.slug,

                            value.slug

                          )

                        }

                      />



                      <span>

                        {value.value}

                      </span>



                    </label>

                  );

                }

              )}



            </div>



          </div>



        )

      )}



    </aside>

  );

}